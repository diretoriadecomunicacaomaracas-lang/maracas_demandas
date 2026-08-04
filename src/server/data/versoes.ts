"use server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAtor } from "@/server/context";
import { can } from "@/lib/permissions";
import { normalizarLinkDrive } from "@/lib/drive";
import { revalidatePath } from "next/cache";

export async function listarVersoes(subId: string) {
  const sb = createSupabaseServer();
  const { data } = await sb.from("versoes").select("id,numero,titulo,link_drive,drive_file_id,estado,vigente,created_at").eq("subdemanda_id", subId).order("numero");
  return data ?? [];
}

// Adiciona versão: valida link do Drive + dedupe por ID (mensagem amigável) + invalida aprovações anteriores.
export async function adicionarVersao(subId: string, linkBruto: string, titulo?: string) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "editar_operacional")) return { ok: false, erro: "Sem permissão para cadastrar versão." };
  const norm = normalizarLinkDrive(linkBruto);
  if (!norm.ok) return { ok: false, erro: norm.motivo };
  const sb = createSupabaseServer();
  const { data: ativas } = await sb.from("versoes").select("numero,drive_file_id,estado").eq("subdemanda_id", subId).not("estado", "in", "(substituida,cancelada)");
  const dup = (ativas ?? []).find((v: any) => v.drive_file_id === norm.fileId);
  if (dup) return { ok: false, erro: `Este arquivo do Drive já está na versão V${dup.numero}. Cada versão deve ter um arquivo próprio.` };
  // invalida aprovações/liberações/confirmações e marca vigente anterior como substituída
  const { data: vs } = await sb.from("versoes").select("id,vigente").eq("subdemanda_id", subId);
  for (const v of vs ?? []) {
    if (v.vigente) await sb.from("versoes").update({ vigente: false, estado: "substituida" }).eq("id", v.id);
    await sb.from("aprovacoes").update({ ativa: false }).eq("versao_id", v.id).eq("ativa", true);
    await sb.from("liberacoes").update({ ativa: false }).eq("versao_id", v.id).eq("ativa", true);
    await sb.from("confirmacoes_grafica").update({ ativa: false }).eq("versao_id", v.id).eq("ativa", true);
  }
  // número = maior número já existente (incluindo substituídas) + 1, evitando colisão no unique(subdemanda_id,numero)
  const { data: todas } = await sb.from("versoes").select("numero").eq("subdemanda_id", subId);
  const numero = (todas ?? []).reduce((m: number, v: any) => Math.max(m, v.numero), 0) + 1;
  const { error } = await sb.from("versoes").insert({ subdemanda_id: subId, numero, titulo: titulo ?? null, link_drive: norm.canonical, estado: "em_revisao", vigente: true, autor_id: ator.id });
  if (error) {
    if (String(error.message).includes("versoes_fileid_unico_ativo")) return { ok: false, erro: "Este arquivo do Drive já está em uso em outra versão ativa." };
    return { ok: false, erro: "Não foi possível cadastrar a versão." };
  }
  await sb.from("auditoria").insert({ entidade: "versao", entidade_id: subId, acao: "criada", autor_id: ator.id, valor_novo: { numero, fileId: norm.fileId } });
  revalidatePath(`/app/demandas`);
  return { ok: true, numero };
}
