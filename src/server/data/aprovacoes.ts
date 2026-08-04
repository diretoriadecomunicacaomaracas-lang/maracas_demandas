"use server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAtor } from "@/server/context";
import { can } from "@/lib/permissions";
import { validarLiberacaoImpressao, type EstadoLiberacao } from "@/lib/impressao";
import { revalidatePath } from "next/cache";
import { notificarEnvolvidos, notificarUsuarios } from "@/server/notify";

function cargoAprovador(cargos: string[]): "diretor" | "coordenador" | null {
  if (cargos.includes("diretor")) return "diretor"; if (cargos.includes("coordenador")) return "coordenador"; return null;
}

export async function aprovarDigital(versaoId: string, decisao: "aprovar" | "aprovar_com_observacao" | "solicitar_correcao" | "reprovar", observacao?: string) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "aprovar_digital")) return { ok: false, erro: "Aprovação é do Diretor/Coordenador." };
  const cargo = cargoAprovador(ator.cargos)!; const sb = createSupabaseServer();
  await sb.from("aprovacoes").insert({ versao_id: versaoId, usuario_id: ator.id, cargo_chave: cargo, decisao, observacao: observacao ?? null, ativa: true });
  if (decisao.startsWith("aprovar")) await sb.from("versoes").update({ estado: "aprovada" }).eq("id", versaoId);
  await sb.from("auditoria").insert({ entidade: "versao", entidade_id: versaoId, acao: `aprovacao:${decisao}`, autor_id: ator.id });
  { const { data: v } = await sb.from("versoes").select("subdemanda_id").eq("id", versaoId).maybeSingle(); if (v) await notificarEnvolvidos(v.subdemanda_id, ator.id, "aprovacao", decisao.startsWith("aprovar") ? "Material aprovado" : "Correção solicitada"); }
  revalidatePath("/app/demandas"); return { ok: true };
}
export async function liberarPublicacao(versaoId: string) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "liberar_publicacao")) return { ok: false, erro: "Liberação é do Diretor/Coordenador." };
  const sb = createSupabaseServer();
  const { count } = await sb.from("aprovacoes").select("*", { count: "exact", head: true }).eq("versao_id", versaoId).eq("ativa", true).in("decisao", ["aprovar", "aprovar_com_observacao"]);
  if (!count) return { ok: false, erro: "A versão precisa estar aprovada antes de liberar." };
  await sb.from("liberacoes").insert({ versao_id: versaoId, tipo: "publicacao", usuario_id: ator.id, cargo_chave: cargoAprovador(ator.cargos)! , ativa: true });
  await sb.from("versoes").update({ estado: "liberada_publicacao" }).eq("id", versaoId);
  { const { data: v } = await sb.from("versoes").select("subdemanda_id").eq("id", versaoId).maybeSingle(); if (v) await notificarEnvolvidos(v.subdemanda_id, ator.id, "liberacao", "Material liberado para publicação"); }
  revalidatePath("/app/demandas"); return { ok: true };
}

export async function aprovarImpresso(versaoId: string) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "aprovar_impresso")) return { ok: false, erro: "Aprovação de impresso é do Diretor/Coordenador." };
  const cargo = cargoAprovador(ator.cargos); if (!cargo) return { ok: false, erro: "Cargo aprovador não identificado." };
  const sb = createSupabaseServer();
  const { count } = await sb.from("aprovacoes").select("*", { count: "exact", head: true }).eq("versao_id", versaoId).eq("cargo_chave", cargo).eq("ativa", true);
  if (count) return { ok: false, erro: `Já existe aprovação ativa do ${cargo} nesta versão.` };
  await sb.from("aprovacoes").insert({ versao_id: versaoId, usuario_id: ator.id, cargo_chave: cargo, decisao: "aprovar", ativa: true });
  await sb.from("auditoria").insert({ entidade: "versao", entidade_id: versaoId, acao: `aprovacao_impresso:${cargo}`, autor_id: ator.id });
  revalidatePath("/app/demandas"); return { ok: true };
}

// Monta o checklist a partir do banco (mesma regra do SQL validar_liberacao_impressao).
export async function estadoLiberacao(versaoId: string): Promise<EstadoLiberacao> {
  const sb = createSupabaseServer();
  const { data: v } = await sb.from("versoes").select("*").eq("id", versaoId).single();
  const { data: ped } = await sb.from("pedidos_impressao").select("*").eq("subdemanda_id", v.subdemanda_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { data: aps } = await sb.from("aprovacoes").select("cargo_chave,decisao,ativa").eq("versao_id", versaoId).eq("ativa", true);
  const coord = (aps ?? []).some((a: any) => a.cargo_chave === "coordenador" && a.decisao.startsWith("aprovar"));
  const dir = (aps ?? []).some((a: any) => a.cargo_chave === "diretor" && a.decisao.startsWith("aprovar"));
  return {
    versaoVigente: v.vigente, versaoEstado: v.estado, aprovacaoCoordenadorAtiva: coord, aprovacaoDiretorAtiva: dir, aprovacoesMesmaVersao: coord && dir,
    graficaSelecionada: !!ped?.grafica_id, quantidade: ped?.quantidade, medidas: ped?.medidas, formato: ped?.formato, material: ped?.material,
    acabamento: ped?.acabamento, prazoInformado: !!ped?.prazo, localEntrega: ped?.local_entrega, existeLiberacaoIncompativel: false,
  };
}
export async function liberarImpressao(versaoId: string) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "liberar_impressao")) return { ok: false, erro: "Liberação de impressão é do Diretor/Coordenador." };
  const pend = validarLiberacaoImpressao(await estadoLiberacao(versaoId));
  if (pend.length) return { ok: false, erro: "Há pendências para liberar.", pendencias: pend };
  const sb = createSupabaseServer();
  const { data: v } = await sb.from("versoes").select("subdemanda_id").eq("id", versaoId).single();
  await sb.from("liberacoes").insert({ versao_id: versaoId, tipo: "impressao", usuario_id: ator.id, cargo_chave: cargoAprovador(ator.cargos)!, ativa: true });
  await sb.from("versoes").update({ estado: "liberada_impressao" }).eq("id", versaoId);
  await sb.from("pedidos_impressao").update({ versao_liberada_id: versaoId, status: "aguardando_confirmacao" }).eq("subdemanda_id", v.subdemanda_id);
  await sb.from("auditoria").insert({ entidade: "versao", entidade_id: versaoId, acao: "liberada_impressao", autor_id: ator.id });
  { const { data: ped } = await sb.from("pedidos_impressao").select("grafica_id, subdemanda_id").eq("subdemanda_id", v.subdemanda_id).order("created_at", { ascending: false }).limit(1).maybeSingle(); if (ped?.grafica_id) { const { data: us } = await sb.from("usuarios").select("id").eq("grafica_id", ped.grafica_id); await notificarUsuarios((us ?? []).map((u:any)=>u.id), "impressao_liberada", "Nova versão liberada para impressão", "/grafica"); } }
  revalidatePath("/app/demandas"); return { ok: true };
}
