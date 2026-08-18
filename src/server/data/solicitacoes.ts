"use server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAtor } from "@/server/context";
import { respeita24h } from "@/domain/rules";
import { can } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function listarSolicitacoes() {
  const sb = createSupabaseServer();
  const { data } = await sb.from("solicitacoes")
    .select("id,protocolo,titulo,tipo,secretaria_id,status_externo,prazo_desejado,restrita,created_at,criado_por")
    .is("deleted_at", null).order("created_at", { ascending: false });
  return data ?? []; // RLS já filtra por secretaria/restrita/interno
}

export async function criarSolicitacao(form: FormData) {
  const ator = await getAtor();
  if (!ator || ator.ambiente !== "solicitante") return { ok: false, erro: "Apenas solicitantes criam solicitações." };
  const prazo = String(form.get("prazo") ?? "");
  if (prazo && !respeita24h(prazo)) return { ok: false, erro: "As solicitações devem ter no mínimo 24 horas de antecedência." };
  const sb = createSupabaseServer();
  const unidadeId = String(form.get("unidade_id") ?? "");
  if (!unidadeId) return { ok: false, erro: "Selecione o setor/unidade solicitante." };
  // Setor deve pertencer à secretaria do solicitante (nunca de outra secretaria).
  const { data: uni } = await sb.from("unidades").select("id").eq("id", unidadeId).eq("secretaria_id", ator.secretariaId).maybeSingle();
  if (!uni) return { ok: false, erro: "Setor inválido para a sua secretaria." };
  const { data, error } = await sb.from("solicitacoes").insert({
    titulo: String(form.get("titulo") ?? ""), descricao: String(form.get("descricao") ?? ""),
    tipo: String(form.get("tipo") ?? "digital"), canal: String(form.get("canal") ?? ""),
    secretaria_id: ator.secretariaId, unidade_id: unidadeId, criado_por: ator.id,
    prazo_desejado: prazo || null, restrita: form.get("restrita") === "on",
  }).select("protocolo").single();
  if (error) return { ok: false, erro: "Não foi possível enviar a solicitação." };
  revalidatePath("/portal");
  return { ok: true, protocolo: data?.protocolo };
}

export async function enviarMensagemSolic(solicId: string, conteudo: string, visibilidade: "publica" | "interna" = "publica") {
  const ator = await getAtor(); if (!ator) return { ok: false, erro: "Não autenticado." };
  if (!conteudo.trim()) return { ok: false, erro: "Mensagem vazia." };
  const sb = createSupabaseServer();
  if (visibilidade === "interna") {
    // Mensagem interna: só Coordenação/Direção (matriz) e requer a coluna do PATCH_0007.
    if (!can(ator.cargos, "moderar_conversa")) return { ok: false, erro: "Apenas Coordenação/Direção enviam comentários internos." };
    const { error } = await sb.from("solicitacao_mensagens").insert({ solicitacao_id: solicId, autor_id: ator.id, origem: ator.ambiente, conteudo, visibilidade: "interna" });
    if (error) return { ok: false, erro: "Comentário interno requer o PATCH_0007 aplicado (coluna 'visibilidade')." };
  } else {
    // Pública: funciona no schema atual (sem a coluna) e no pós-patch (default 'publica').
    const { error } = await sb.from("solicitacao_mensagens").insert({ solicitacao_id: solicId, autor_id: ator.id, origem: ator.ambiente, conteudo });
    if (error) return { ok: false, erro: "Falha ao enviar." };
  }
  revalidatePath(`/app/solicitacoes/${solicId}`); revalidatePath(`/portal/${solicId}`);
  return { ok: true };
}

// Registra o início da análise ao abrir a solicitação pelo botão "Analisar".
export async function registrarInicioAnalise(solicId: string) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "triagem")) return;
  const sb = createSupabaseServer();
  const { data: s } = await sb.from("solicitacoes").select("status_externo").eq("id", solicId).maybeSingle();
  if (s?.status_externo === "enviada") {
    await sb.from("solicitacoes").update({ status_externo: "em_analise" }).eq("id", solicId);
    await sb.from("auditoria").insert({ entidade: "solicitacao", entidade_id: solicId, acao: "triagem_iniciar_analise", autor_id: ator.id });
    revalidatePath("/app/solicitacoes");
  }
}

// Triagem (interno). aprovar → cria demanda + subdemanda.
export async function triagem(solicId: string, acao: "iniciar_analise" | "pedir_info" | "ajustar_prazo" | "recusar" | "cancelar" | "aprovar", extra?: { prazo?: string; justificativa?: string }) {
  const ator = await getAtor();
  if (!ator || !can(ator.cargos, "triagem")) return { ok: false, erro: "Triagem é da Coordenação/Direção." };
  const sb = createSupabaseServer();
  const { data: s } = await sb.from("solicitacoes").select("*").eq("id", solicId).single();
  if (!s) return { ok: false, erro: "Solicitação não encontrada." };
  if (acao === "iniciar_analise") await sb.from("solicitacoes").update({ status_externo: "em_analise" }).eq("id", solicId);
  else if (acao === "pedir_info") await sb.from("solicitacoes").update({ status_externo: "aguardando_informacoes" }).eq("id", solicId);
  else if (acao === "ajustar_prazo") await sb.from("solicitacoes").update({ prazo_desejado: extra?.prazo ?? s.prazo_desejado }).eq("id", solicId);
  else if (acao === "recusar") await sb.from("solicitacoes").update({ status_externo: "recusada" }).eq("id", solicId);
  else if (acao === "cancelar") await sb.from("solicitacoes").update({ status_externo: "cancelada" }).eq("id", solicId);
  else if (acao === "aprovar") {
    await sb.from("solicitacoes").update({ status_externo: "aprovada_planejamento" }).eq("id", solicId);
    const { data: dem } = await sb.from("demandas").insert({ titulo: s.titulo, solicitacao_id: s.id }).select("id").single();
    await sb.from("subdemandas").insert({ demanda_id: dem?.id, titulo: s.titulo, tipo: s.tipo ?? "digital", prazo: s.prazo_desejado, secretaria_id: s.secretaria_id, etapa: "planejamento", macroetapa: "planejamento" });
    await sb.from("auditoria").insert({ entidade: "solicitacao", entidade_id: s.id, acao: "aprovada_convertida", autor_id: ator.id });
    revalidatePath("/app/solicitacoes"); revalidatePath("/app/demandas");
    return { ok: true, demandaId: dem?.id };
  }
  await sb.from("auditoria").insert({ entidade: "solicitacao", entidade_id: s.id, acao: `triagem_${acao}`, autor_id: ator.id, justificativa: extra?.justificativa ?? null });
  const rotulo: Record<string,string> = { iniciar_analise: "Sua solicitação entrou em análise", pedir_info: "A Comunicação pediu mais informações", recusar: "Sua solicitação foi recusada", cancelar: "Sua solicitação foi cancelada", ajustar_prazo: "O prazo da sua solicitação foi ajustado" };
  if (s.criado_por !== ator.id && rotulo[acao]) await notificarUsuarios([s.criado_por], `solic_${acao}`, `${rotulo[acao]} (${s.protocolo})`, `/portal/${s.id}`);
  revalidatePath("/app/solicitacoes");
  return { ok: true };
}


// Central enriquecida: junta secretaria, setor, solicitante, demanda gerada e decisão (auditoria).
export async function listarCentral() {
  const sb = createSupabaseServer();
  const { data: sols } = await sb.from("solicitacoes")
    .select("id,protocolo,titulo,tipo,secretaria_id,unidade_id,criado_por,prazo_desejado,status_externo,created_at,restrita")
    .is("deleted_at", null).order("created_at", { ascending: true });
  const lista = sols ?? [];
  if (!lista.length) return [];
  const secIds = [...new Set(lista.map((x: any) => x.secretaria_id).filter(Boolean))];
  const uniIds = [...new Set(lista.map((x: any) => x.unidade_id).filter(Boolean))];
  const userIds = [...new Set(lista.map((x: any) => x.criado_por).filter(Boolean))];
  const ids = lista.map((x: any) => x.id);
  const [secs, unis, users, dems, auds] = await Promise.all([
    secIds.length ? sb.from("secretarias").select("id,nome").in("id", secIds) : Promise.resolve({ data: [] }),
    uniIds.length ? sb.from("unidades").select("id,nome").in("id", uniIds) : Promise.resolve({ data: [] }),
    userIds.length ? sb.from("usuarios").select("id,nome").in("id", userIds) : Promise.resolve({ data: [] }),
    sb.from("demandas").select("id,solicitacao_id").in("solicitacao_id", ids),
    sb.from("auditoria").select("entidade_id,acao,autor_id,created_at,justificativa").eq("entidade", "solicitacao").in("entidade_id", ids).order("created_at", { ascending: false }),
  ]);
  const mSec = new Map((secs.data ?? []).map((x: any) => [x.id, x.nome]));
  const mUni = new Map((unis.data ?? []).map((x: any) => [x.id, x.nome]));
  const mUser = new Map((users.data ?? []).map((x: any) => [x.id, x.nome]));
  const mDem = new Map((dems.data ?? []).map((x: any) => [x.solicitacao_id, x.id]));
  const mAud = new Map<string, any>();
  for (const a of auds.data ?? []) {
    const relevante = a.acao.startsWith("triagem_") || a.acao === "aprovada_convertida";
    if (relevante && !mAud.has(a.entidade_id)) mAud.set(a.entidade_id, a); // auds vêm em ordem desc → pega a mais recente
  }
  return lista.map((s: any) => ({
    ...s,
    secretaria: mSec.get(s.secretaria_id) ?? "—",
    setor: mUni.get(s.unidade_id) ?? "—",
    solicitante: mUser.get(s.criado_por) ?? "—",
    demandaId: mDem.get(s.id) ?? null,
    decisao: mAud.get(s.id) ?? null,
  }));
}

// --- Ajuste: briefing duplo + aprovação estruturada ---
import { validarAprovacaoDemanda } from "@/domain/triagem";
import { notificarUsuarios } from "@/server/notify";

export async function getSolicitacaoCompleta(id: string) {
  const sb = createSupabaseServer();
  const { data: s } = await sb.from("solicitacoes").select("*").eq("id", id).maybeSingle();
  if (!s) return null;
  const [{ data: sec }, { data: uni }, { data: user }, { data: msgs }, { data: hist }, { data: dem }] = await Promise.all([
    s.secretaria_id ? sb.from("secretarias").select("nome").eq("id", s.secretaria_id).maybeSingle() : Promise.resolve({ data: null }),
    s.unidade_id ? sb.from("unidades").select("nome").eq("id", s.unidade_id).maybeSingle() : Promise.resolve({ data: null }),
    s.criado_por ? sb.from("usuarios").select("nome").eq("id", s.criado_por).maybeSingle() : Promise.resolve({ data: null }),
    sb.from("solicitacao_mensagens").select("*").eq("solicitacao_id", id).order("created_at"),
    sb.from("auditoria").select("acao,autor_id,created_at,justificativa,valor_anterior,valor_novo").eq("entidade_id", id).order("created_at", { ascending: false }).limit(40),
    sb.from("demandas").select("id").eq("solicitacao_id", id).maybeSingle(),
  ]);
  return { ...s, secretariaNome: sec?.nome ?? "—", setorNome: uni?.nome ?? "—", solicitanteNome: user?.nome ?? "—", mensagens: msgs ?? [], historico: hist ?? [], demandaId: dem?.id ?? null };
}

// Briefing interno: editável por Diretor/Coordenador; nunca sobrescreve o original (descricao).
export async function salvarBriefingInterno(solicId: string, texto: string) {
  const ator = await getAtor();
  if (!ator || !ator.cargos.some((c) => ["diretor", "coordenador", "administrador"].includes(c))) return { ok: false, erro: "Sem permissão." };
  const sb = createSupabaseServer();
  const { data: atual } = await sb.from("solicitacoes").select("briefing_interno").eq("id", solicId).maybeSingle();
  await sb.from("solicitacoes").update({ briefing_interno: texto }).eq("id", solicId);
  await sb.from("auditoria").insert({ entidade: "solicitacao", entidade_id: solicId, acao: "briefing_interno_editado", autor_id: ator.id, valor_anterior: { briefing_interno: atual?.briefing_interno ?? null }, valor_novo: { briefing_interno: texto } });
  revalidatePath(`/app/solicitacoes/${solicId}`);
  return { ok: true };
}

// Aprovar → demanda com validação obrigatória e cópia do briefing consolidado.
export async function aprovarParaDemanda(solicId: string, dados: { tipo: string; area: string; prazo: string; prioridade: string; responsavelId?: string; membros?: string[]; aguardandoDistribuicao?: boolean }) {
  const ator = await getAtor();
  if (!ator || !can(ator.cargos, "triagem")) return { ok: false, erro: "Triagem é da Coordenação/Direção." };
  const sb = createSupabaseServer();
  const { data: s } = await sb.from("solicitacoes").select("*").eq("id", solicId).maybeSingle();
  if (!s) return { ok: false, erro: "Solicitação não encontrada." };
  const pend = validarAprovacaoDemanda({ briefingInterno: s.briefing_interno, ...dados });
  if (pend.length) return { ok: false, erro: "Há pendências para aprovar.", pendencias: pend };
  const { data: dem } = await sb.from("demandas").insert({
    titulo: s.titulo, solicitacao_id: s.id, prioridade: dados.prioridade,
    briefing_consolidado: s.briefing_interno, secretaria_id: s.secretaria_id, unidade_id: s.unidade_id,
  }).select("id").single();
  const etapaInicial = dados.aguardandoDistribuicao || !dados.responsavelId ? "distribuicao" : "criacao";
  const { data: sub } = await sb.from("subdemandas").insert({
    demanda_id: dem?.id, titulo: s.titulo, tipo: dados.tipo, area: dados.area, prioridade: dados.prioridade,
    prazo: dados.prazo, secretaria_id: s.secretaria_id, responsavel_id: dados.responsavelId ?? null,
    etapa: etapaInicial, macroetapa: etapaInicial === "criacao" ? "producao" : "planejamento",
  }).select("id").single();
  for (const m of dados.membros ?? []) await sb.from("subdemanda_membros").insert({ subdemanda_id: sub?.id, usuario_id: m });
  const envolvidos = [...(dados.responsavelId ? [dados.responsavelId] : []), ...(dados.membros ?? [])].filter((id) => id !== ator.id);
  if (envolvidos.length) await notificarUsuarios(envolvidos, "atribuicao", `Você foi atribuído à demanda: ${s.titulo}`, `/app/demandas/${sub?.id}`);
  await sb.from("solicitacoes").update({ status_externo: "aprovada_planejamento" }).eq("id", solicId);
  await sb.from("auditoria").insert({ entidade: "solicitacao", entidade_id: solicId, acao: "aprovada_convertida", autor_id: ator.id, valor_novo: { demandaId: dem?.id } });
  if (s.criado_por !== ator.id) await notificarUsuarios([s.criado_por], "solic_aprovada", `Sua solicitação foi aprovada e está em execução (${s.protocolo})`, `/portal/${s.id}`);
  revalidatePath("/app/solicitacoes"); revalidatePath("/app/demandas");
  return { ok: true, demandaId: dem?.id };
}
