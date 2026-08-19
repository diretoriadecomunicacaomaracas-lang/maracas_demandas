"use server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAtor } from "@/server/context";
import { can } from "@/lib/permissions";
import { transicaoKanbanValida, mensagemDestinos, MACRO } from "@/domain/flows";
import { revalidatePath } from "next/cache";
import { notificarEnvolvidos, notificarUsuarios } from "@/server/notify";

export async function listarSubdemandas() {
  const sb = createSupabaseServer();
  const { data } = await sb.from("subdemandas")
    .select("id,demanda_id,titulo,tipo,etapa,macroetapa,prazo,prioridade,responsavel_id,secretaria_id,situacao")
    .eq("situacao", "ativa").order("created_at", { ascending: false });
  return data ?? [];
}
export async function getSubdemanda(id: string) {
  const sb = createSupabaseServer();
  const { data } = await sb.from("subdemandas").select("*").eq("id", id).single();
  return data;
}

export async function criarSubdemanda(demandaId: string, titulo: string, tipo: string) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "criar_demanda")) return { ok: false, erro: "Sem permissão." };
  const sb = createSupabaseServer();
  const { error } = await sb.from("subdemandas").insert({ demanda_id: demandaId, titulo, tipo, etapa: "planejamento", macroetapa: "planejamento" });
  if (error) return { ok: false, erro: "Falha ao criar subdemanda." };
  revalidatePath("/app/demandas"); return { ok: true };
}

// Kanban: mover etapa com validação no servidor (permissão + membro + transição + etapa crítica).
export async function moverEtapa(subId: string, novaEtapa: string) {
  const ator = await getAtor(); if (!ator) return { ok: false, erro: "Não autenticado." };
  const sb = createSupabaseServer();
  const { data: s } = await sb.from("subdemandas").select("id,tipo,etapa,responsavel_id").eq("id", subId).single();
  if (!s) return { ok: false, erro: "Subdemanda não encontrada." };
  const { data: mem } = await sb.from("subdemanda_membros").select("usuario_id").eq("subdemanda_id", subId);
  const ehMembro = s.responsavel_id === ator.id || (mem ?? []).some((m: any) => m.usuario_id === ator.id);
  if (!can(ator.cargos, "movimentar_producao") || !(ehMembro || can(ator.cargos, "editar_admin_demanda")))
    return { ok: false, erro: "Você não participa desta subdemanda." };
  if (!transicaoKanbanValida(s.tipo, s.etapa, novaEtapa))
    return { ok: false, erro: mensagemDestinos(s.tipo, s.etapa) };
  await sb.from("subdemandas").update({ etapa: novaEtapa, macroetapa: MACRO[novaEtapa] ?? s.etapa }).eq("id", subId);
  await sb.from("auditoria").insert({ entidade: "subdemanda", entidade_id: subId, acao: "mover_etapa", autor_id: ator.id, valor_anterior: { etapa: s.etapa }, valor_novo: { etapa: novaEtapa } });
  await notificarEnvolvidos(subId, ator.id, "mudanca_etapa", `Etapa atualizada em uma demanda que você participa`, `/app/demandas/${subId}`);
  revalidatePath("/app/demandas");
  return { ok: true };
}

export async function arquivar(subId: string) {
  const ator = await getAtor(); if (!ator || !ator.cargos.some(c => ["administrador","diretor","coordenador"].includes(c))) return { ok: false, erro: "Sem permissão." };
  const sb = createSupabaseServer(); await sb.from("subdemandas").update({ situacao: "arquivada" }).eq("id", subId);
  await sb.from("auditoria").insert({ entidade: "subdemanda", entidade_id: subId, acao: "arquivada", autor_id: ator.id });
  revalidatePath("/app/demandas"); revalidatePath("/app/arquivadas"); return { ok: true };
}
export async function excluirLogico(subId: string, justificativa: string) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "excluir_logico")) return { ok: false, erro: "Exclusão lógica é de Admin/Diretor/Coordenador." };
  if (!justificativa.trim()) return { ok: false, erro: "Justificativa obrigatória." };
  const sb = createSupabaseServer(); await sb.from("subdemandas").update({ situacao: "excluida_logicamente", deleted_at: new Date().toISOString() }).eq("id", subId);
  await sb.from("auditoria").insert({ entidade: "subdemanda", entidade_id: subId, acao: "excluida_logicamente", autor_id: ator.id, justificativa });
  revalidatePath("/app/demandas"); return { ok: true };
}
// Restaura uma subdemanda excluída logicamente (Lixeira).
export async function restaurarSubdemanda(subId: string) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "excluir_logico")) return { ok: false, erro: "Restauração é de Admin/Diretor/Coordenador." };
  const sb = createSupabaseServer();
  await sb.from("subdemandas").update({ situacao: "ativa", deleted_at: null }).eq("id", subId);
  await sb.from("auditoria").insert({ entidade: "subdemanda", entidade_id: subId, acao: "restaurada", autor_id: ator.id });
  revalidatePath("/app/demandas"); revalidatePath("/app/lixeira"); return { ok: true };
}

// Finalizadas / arquivadas (arquivo-histórico; fora do Kanban ativo).
export async function listarFinalizadas() {
  const sb = createSupabaseServer();
  const { data } = await sb.from("subdemandas")
    .select("id,titulo,tipo,etapa,situacao,prazo,secretaria_id,updated_at")
    .or("etapa.eq.finalizado,situacao.eq.arquivada").neq("situacao", "excluida_logicamente").is("deleted_at", null)
    .order("updated_at", { ascending: false }).limit(500);
  const secIds = [...new Set((data ?? []).map((s: any) => s.secretaria_id).filter(Boolean))];
  const { data: secs } = secIds.length ? await sb.from("secretarias").select("id,nome").in("id", secIds) : { data: [] };
  const mSec = new Map((secs ?? []).map((s: any) => [s.id, s.nome] as [string, string]));
  return (data ?? []).map((s: any) => ({ ...s, secretariaNome: mSec.get(s.secretaria_id) ?? null }));
}

// Lixeira: subdemandas excluídas logicamente + autor/motivo/data (auditoria).
export async function listarLixeira() {
  const sb = createSupabaseServer();
  const { data } = await sb.from("subdemandas").select("id,titulo,tipo,secretaria_id,deleted_at").eq("situacao", "excluida_logicamente").limit(500);
  const ids = (data ?? []).map((s: any) => s.id);
  if (!ids.length) return [];
  const [{ data: auds }, { data: users }] = await Promise.all([
    sb.from("auditoria").select("entidade_id,autor_id,justificativa,created_at").eq("entidade", "subdemanda").eq("acao", "excluida_logicamente").in("entidade_id", ids).order("created_at", { ascending: false }),
    sb.from("usuarios").select("id,nome"),
  ]);
  const mUser = new Map((users ?? []).map((u: any) => [u.id, u.nome] as [string, string]));
  const mAud = new Map<string, any>();
  for (const a of auds ?? []) if (!mAud.has(a.entidade_id)) mAud.set(a.entidade_id, a);
  return (data ?? []).map((s: any) => {
    const a = mAud.get(s.id);
    return { ...s, excluidoPor: a ? mUser.get(a.autor_id) ?? "—" : "—", motivo: a?.justificativa ?? "—", quando: a?.created_at ?? null };
  });
}

export async function reabrir(subId: string, etapaRetorno: string, justificativa: string) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "reabrir_demanda")) return { ok: false, erro: "Reabertura é de Diretor/Coordenador." };
  if (!justificativa.trim()) return { ok: false, erro: "Justificativa obrigatória." };
  const sb = createSupabaseServer();
  const anteriorAprov = ["planejamento","criacao","roteiro","gravacao","edicao","revisao"].includes(etapaRetorno);
  if (anteriorAprov) {
    const { data: vs } = await sb.from("versoes").select("id").eq("subdemanda_id", subId);
    for (const v of vs ?? []) await sb.from("aprovacoes").update({ ativa: false }).eq("versao_id", v.id).eq("ativa", true);
  }
  await sb.from("subdemandas").update({ situacao: "ativa", etapa: etapaRetorno, macroetapa: MACRO[etapaRetorno] ?? "planejamento" }).eq("id", subId);
  await sb.from("auditoria").insert({ entidade: "subdemanda", entidade_id: subId, acao: "reaberta", autor_id: ator.id, valor_novo: { etapa: etapaRetorno }, justificativa });
  revalidatePath("/app/demandas"); return { ok: true };
}

// --- Ajuste: responsáveis visíveis ---
import { mapaUsuarios } from "@/server/data/usuarios";

// Lista subdemandas com responsável e membros (nome + avatar) para Tabela/Kanban.
export async function listarSubdemandasComEquipe() {
  const sb = createSupabaseServer();
  const { data: subs } = await sb.from("subdemandas")
    .select("id,demanda_id,titulo,tipo,etapa,macroetapa,prazo,prioridade,responsavel_id,area,secretaria_id,situacao")
    .eq("situacao", "ativa").order("created_at", { ascending: false });
  const lista = subs ?? [];
  const { data: mem } = await sb.from("subdemanda_membros").select("subdemanda_id,usuario_id").in("subdemanda_id", lista.map((s: any) => s.id).length ? lista.map((s: any) => s.id) : ["_"]);
  const ids = [...new Set([...lista.map((s: any) => s.responsavel_id).filter(Boolean), ...(mem ?? []).map((m: any) => m.usuario_id)])];
  const mUsers = await mapaUsuarios(ids as string[]);
  return lista.map((s: any) => {
    const membros = (mem ?? []).filter((m: any) => m.subdemanda_id === s.id).map((m: any) => ({ id: m.usuario_id, ...(mUsers.get(m.usuario_id) ?? { nome: "?", avatarUrl: null }) }));
    const resp = s.responsavel_id ? { id: s.responsavel_id, ...(mUsers.get(s.responsavel_id) ?? { nome: "?", avatarUrl: null }) } : null;
    return { ...s, responsavel: resp, membros };
  });
}

async function podeDistribuir() {
  const ator = await getAtor();
  if (!ator || !can(ator.cargos, "editar_admin_demanda")) return null; // Diretor/Coordenador (matriz)
  return ator;
}
export async function atribuirResponsavel(subId: string, usuarioId: string | null) {
  const ator = await podeDistribuir(); if (!ator) return { ok: false, erro: "Só Diretor/Coordenador distribuem." };
  const sb = createSupabaseServer();
  const { data: atual } = await sb.from("subdemandas").select("responsavel_id").eq("id", subId).maybeSingle();
  await sb.from("subdemandas").update({ responsavel_id: usuarioId }).eq("id", subId);
  await sb.from("auditoria").insert({ entidade: "subdemanda", entidade_id: subId, acao: "responsavel_alterado", autor_id: ator.id, valor_anterior: { responsavel_id: atual?.responsavel_id ?? null }, valor_novo: { responsavel_id: usuarioId } });
  if (usuarioId && usuarioId !== ator.id) await notificarUsuarios([usuarioId], "atribuicao", "Você foi definido como responsável por uma demanda", `/app/demandas/${subId}`);
  revalidatePath("/app/demandas"); revalidatePath(`/app/demandas/${subId}`);
  return { ok: true };
}
export async function adicionarMembro(subId: string, usuarioId: string) {
  const ator = await podeDistribuir(); if (!ator) return { ok: false, erro: "Só Diretor/Coordenador distribuem." };
  const sb = createSupabaseServer();
  const { error } = await sb.from("subdemanda_membros").insert({ subdemanda_id: subId, usuario_id: usuarioId });
  if (error) return { ok: false, erro: "Membro já incluído ou erro." };
  await sb.from("auditoria").insert({ entidade: "subdemanda", entidade_id: subId, acao: "membro_adicionado", autor_id: ator.id, valor_novo: { usuario_id: usuarioId } });
  if (usuarioId !== ator.id) await notificarUsuarios([usuarioId], "atribuicao", "Você foi adicionado como colaborador em uma demanda", `/app/demandas/${subId}`);
  revalidatePath(`/app/demandas/${subId}`); return { ok: true };
}
export async function removerMembro(subId: string, usuarioId: string) {
  const ator = await podeDistribuir(); if (!ator) return { ok: false, erro: "Só Diretor/Coordenador distribuem." };
  const sb = createSupabaseServer();
  await sb.from("subdemanda_membros").delete().eq("subdemanda_id", subId).eq("usuario_id", usuarioId);
  await sb.from("auditoria").insert({ entidade: "subdemanda", entidade_id: subId, acao: "membro_removido", autor_id: ator.id, valor_anterior: { usuario_id: usuarioId } });
  revalidatePath(`/app/demandas/${subId}`); return { ok: true };
}
export async function equipeDaSubdemanda(subId: string) {
  const sb = createSupabaseServer();
  const { data: s } = await sb.from("subdemandas").select("responsavel_id,area").eq("id", subId).maybeSingle();
  const { data: mem } = await sb.from("subdemanda_membros").select("usuario_id").eq("subdemanda_id", subId);
  const ids = [...(s?.responsavel_id ? [s.responsavel_id] : []), ...(mem ?? []).map((m: any) => m.usuario_id)];
  const mUsers = await mapaUsuarios(ids);
  return {
    area: s?.area ?? null,
    responsavel: s?.responsavel_id ? { id: s.responsavel_id, ...(mUsers.get(s.responsavel_id) ?? { nome: "?", avatarUrl: null }) } : null,
    membros: (mem ?? []).map((m: any) => ({ id: m.usuario_id, ...(mUsers.get(m.usuario_id) ?? { nome: "?", avatarUrl: null }) })),
  };
}


// Finaliza a subdemanda e conclui a solicitação vinculada (para o Portal do Solicitante → aba Finalizadas).
export async function finalizarDemanda(subId: string) {
  const ator = await getAtor();
  if (!ator || !can(ator.cargos, "reabrir_demanda")) return { ok: false, erro: "Finalizar é de Diretor/Coordenador." };
  const sb = createSupabaseServer();
  await sb.from("subdemandas").update({ etapa: "finalizado", macroetapa: "finalizado" }).eq("id", subId);
  const { data: sub } = await sb.from("subdemandas").select("demanda_id").eq("id", subId).maybeSingle();
  if (sub?.demanda_id) {
    const { data: dem } = await sb.from("demandas").select("solicitacao_id").eq("id", sub.demanda_id).maybeSingle();
    if (dem?.solicitacao_id) await sb.from("solicitacoes").update({ status_externo: "concluida" }).eq("id", dem.solicitacao_id);
  }
  await sb.from("auditoria").insert({ entidade: "subdemanda", entidade_id: subId, acao: "finalizada", autor_id: ator.id });
  await notificarEnvolvidos(subId, ator.id, "finalizada", "Uma demanda que você participa foi finalizada", `/app/demandas/${subId}`);
  revalidatePath("/app/demandas"); revalidatePath(`/app/demandas/${subId}`); return { ok: true };
}

// --- Página central da demanda: dados completos + edição por categoria ---
import { CAMPOS_GERENCIAIS } from "@/domain/conteudo";

export async function getSubdemandaCompleta(id: string) {
  const sb = createSupabaseServer();
  const { data: s } = await sb.from("subdemandas").select("*").eq("id", id).maybeSingle();
  if (!s) return null;
  const [{ data: dem }, { data: mem }] = await Promise.all([
    s.demanda_id ? sb.from("demandas").select("id,titulo,solicitacao_id,briefing_consolidado,prioridade").eq("id", s.demanda_id).maybeSingle() : Promise.resolve({ data: null }),
    sb.from("subdemanda_membros").select("usuario_id").eq("subdemanda_id", id),
  ]);
  let solic: any = null, secNome = "—", setorNome = "—";
  if (dem?.solicitacao_id) {
    const { data: so } = await sb.from("solicitacoes").select("id,protocolo,descricao,secretaria_id,unidade_id,criado_por").eq("id", dem.solicitacao_id).maybeSingle();
    solic = so;
    if (so?.secretaria_id) { const { data: sec } = await sb.from("secretarias").select("nome").eq("id", so.secretaria_id).maybeSingle(); secNome = sec?.nome ?? "—"; }
    if (so?.unidade_id) { const { data: uni } = await sb.from("unidades").select("nome").eq("id", so.unidade_id).maybeSingle(); setorNome = uni?.nome ?? "—"; }
  }
  const ids = [...(s.responsavel_id ? [s.responsavel_id] : []), ...(mem ?? []).map((m: any) => m.usuario_id)];
  const mUsers = await mapaUsuarios(ids);
  // irmãs (outras subdemandas da mesma demanda principal)
  const { data: irmas } = s.demanda_id ? await sb.from("subdemandas").select("id,titulo,tipo,etapa,prioridade").eq("demanda_id", s.demanda_id).eq("situacao", "ativa") : { data: [] };
  return {
    ...s,
    demanda: dem, protocolo: solic?.protocolo ?? null, briefingOriginal: solic?.descricao ?? null,
    briefingConsolidado: dem?.briefing_consolidado ?? null, secretariaNome: secNome, setorNome,
    responsavel: s.responsavel_id ? { id: s.responsavel_id, ...(mUsers.get(s.responsavel_id) ?? { nome: "?", avatarUrl: null }) } : null,
    membros: (mem ?? []).map((m: any) => ({ id: m.usuario_id, ...(mUsers.get(m.usuario_id) ?? { nome: "?", avatarUrl: null }) })),
    irmas: (irmas ?? []).filter((x: any) => x.id !== id),
  };
}

// Edição GERENCIAL (Diretor/Coordenador). Campos: titulo, tipo, area, prioridade, prazo, briefing_interno(→demanda).
export async function editarGerencial(subId: string, patch: Record<string, any>) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "editar_admin_demanda")) return { ok: false, erro: "Campos gerenciais são do Diretor/Coordenador." };
  const permitidos = ["titulo", "tipo", "area", "prioridade", "prazo"];
  if (patch.prioridade === "emergencial" && !can(ator.cargos, "prioridade_emergencial")) return { ok: false, erro: "Prioridade emergencial requer permissão." };
  const sb = createSupabaseServer();
  const { data: antes } = await sb.from("subdemandas").select("titulo,tipo,area,prioridade,prazo").eq("id", subId).maybeSingle();
  const upd: Record<string, any> = {}; for (const k of permitidos) if (k in patch) upd[k] = patch[k];
  if (Object.keys(upd).length) await sb.from("subdemandas").update(upd).eq("id", subId);
  // briefing consolidado fica na demanda
  if ("briefing_interno" in patch) {
    const { data: s } = await sb.from("subdemandas").select("demanda_id").eq("id", subId).maybeSingle();
    if (s?.demanda_id) await sb.from("demandas").update({ briefing_consolidado: patch.briefing_interno }).eq("id", s.demanda_id);
  }
  await sb.from("auditoria").insert({ entidade: "subdemanda", entidade_id: subId, acao: "edicao_gerencial", autor_id: ator.id, valor_anterior: antes, valor_novo: upd });
  if ("prazo" in upd || "prioridade" in upd) await notificarEnvolvidos(subId, ator.id, "alteracao", "Prazo/prioridade atualizados em uma demanda que você participa", `/app/demandas/${subId}`);
  revalidatePath(`/app/demandas/${subId}`); revalidatePath("/app/demandas");
  return { ok: true };
}

// Edição OPERACIONAL (responsável/membros/gerencial). Campos: resumo, observacoes, conteudo, data_publicacao.
export async function editarOperacional(subId: string, patch: Record<string, any>) {
  const ator = await getAtor(); if (!ator) return { ok: false, erro: "Não autenticado." };
  const sb = createSupabaseServer();
  const { data: s } = await sb.from("subdemandas").select("responsavel_id").eq("id", subId).maybeSingle();
  const { data: mem } = await sb.from("subdemanda_membros").select("usuario_id").eq("subdemanda_id", subId);
  const ehMembro = s?.responsavel_id === ator.id || (mem ?? []).some((m: any) => m.usuario_id === ator.id);
  if (!(can(ator.cargos, "editar_operacional") && (ehMembro || can(ator.cargos, "editar_admin_demanda"))))
    return { ok: false, erro: "Edição operacional é do responsável/colaboradores." };
  const permitidos = ["resumo", "observacoes", "conteudo", "data_publicacao"];
  const upd: Record<string, any> = {}; for (const k of permitidos) if (k in patch) upd[k] = patch[k];
  await sb.from("subdemandas").update(upd).eq("id", subId);
  await sb.from("auditoria").insert({ entidade: "subdemanda", entidade_id: subId, acao: "edicao_operacional", autor_id: ator.id, valor_novo: Object.keys(upd) });
  if ("conteudo" in upd) await notificarEnvolvidos(subId, ator.id, "conteudo", "Roteiro/conteúdo atualizado", `/app/demandas/${subId}`);
  revalidatePath(`/app/demandas/${subId}`);
  return { ok: true };
}
