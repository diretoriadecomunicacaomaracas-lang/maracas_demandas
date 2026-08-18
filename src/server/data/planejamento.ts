"use server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAtor } from "@/server/context";
import { podePlanejar } from "@/lib/permissions";
import { notificarUsuarios } from "@/server/notify";
import { revalidatePath } from "next/cache";

export type ItemBacklog = {
  id: string; titulo: string; tipo: string; etapa: string; prioridade: string;
  prazo: string | null; secretariaNome: string | null; setorNome: string | null;
  responsavelNome: string | null; protocolo: string | null;
};

// Backlog: subdemandas ativas em planejamento/distribuição ainda NÃO programadas
// (sem evento no calendário e sem data de publicação definida).
export async function backlogPlanejamento(): Promise<ItemBacklog[]> {
  const sb = createSupabaseServer();
  const [{ data: subs }, { data: eventos }, { data: secs }, { data: unis }, { data: users }, { data: dems }, { data: sols }] = await Promise.all([
    sb.from("subdemandas").select("id,titulo,tipo,etapa,prioridade,prazo,data_publicacao,secretaria_id,responsavel_id,demanda_id").eq("situacao", "ativa").in("etapa", ["planejamento", "distribuicao"]).is("deleted_at", null),
    sb.from("eventos_calendario").select("subdemanda_id"),
    sb.from("secretarias").select("id,nome"),
    sb.from("unidades").select("id,nome"),
    sb.from("usuarios").select("id,nome"),
    sb.from("demandas").select("id,solicitacao_id,unidade_id"),
    sb.from("solicitacoes").select("id,protocolo,unidade_id"),
  ]);
  const agendadas = new Set((eventos ?? []).map((e: any) => e.subdemanda_id).filter(Boolean));
  const mSec = new Map((secs ?? []).map((s: any) => [s.id, s.nome] as [string, string]));
  const mUni = new Map((unis ?? []).map((u: any) => [u.id, u.nome] as [string, string]));
  const mUser = new Map((users ?? []).map((u: any) => [u.id, u.nome] as [string, string]));
  const mDem = new Map((dems ?? []).map((d: any) => [d.id, d] as [string, any]));
  const mSol = new Map((sols ?? []).map((s: any) => [s.id, s] as [string, any]));
  return (subs ?? [])
    .filter((s: any) => !agendadas.has(s.id) && !s.data_publicacao)
    .map((s: any) => {
      const dem = mDem.get(s.demanda_id); const sol = dem?.solicitacao_id ? mSol.get(dem.solicitacao_id) : null;
      return {
        id: s.id, titulo: s.titulo, tipo: s.tipo, etapa: s.etapa, prioridade: s.prioridade,
        prazo: s.prazo, secretariaNome: mSec.get(s.secretaria_id) ?? null,
        setorNome: mUni.get(dem?.unidade_id ?? sol?.unidade_id) ?? null,
        responsavelNome: mUser.get(s.responsavel_id) ?? null, protocolo: sol?.protocolo ?? null,
      };
    });
}

// Eventos do calendário no intervalo (para o mês exibido).
export async function eventosPlanejamento(deISO: string, ateISO: string) {
  const sb = createSupabaseServer();
  const { data } = await sb.from("eventos_calendario").select("id,titulo,inicio,duracao_min,canal,status,subdemanda_id").gte("inicio", deISO).lte("inicio", ateISO).order("inicio");
  return data ?? [];
}

// Agenda um item do backlog: cria um evento no calendário (reutiliza eventos_calendario).
export async function agendarItem(subId: string, inicioISO: string, duracaoMin: number, canal: string) {
  const ator = await getAtor(); if (!ator || !podePlanejar(ator.cargos)) return { ok: false, erro: "Sem permissão para planejar." };
  const sb = createSupabaseServer();
  const { data: sub } = await sb.from("subdemandas").select("titulo,responsavel_id").eq("id", subId).maybeSingle();
  if (!sub) return { ok: false, erro: "Tarefa não encontrada." };
  const { error } = await sb.from("eventos_calendario").insert({ subdemanda_id: subId, titulo: sub.titulo, inicio: inicioISO, duracao_min: duracaoMin || null, canal: canal || null, status: "planejado" });
  if (error) return { ok: false, erro: "Falha ao agendar." };
  await sb.from("auditoria").insert({ entidade: "subdemanda", entidade_id: subId, acao: "agendado_planejamento", autor_id: ator.id, valor_novo: { inicio: inicioISO } });
  if (sub.responsavel_id && sub.responsavel_id !== ator.id) await notificarUsuarios([sub.responsavel_id], "agendamento", `Tarefa agendada: ${sub.titulo}`, `/app/demandas/${subId}`);
  revalidatePath("/app/planejamento"); revalidatePath("/app/calendario");
  return { ok: true };
}

// Reagenda (altera início/duração) de um evento existente.
export async function reagendarEvento(eventoId: string, inicioISO: string, duracaoMin?: number) {
  const ator = await getAtor(); if (!ator || !podePlanejar(ator.cargos)) return { ok: false, erro: "Sem permissão." };
  const sb = createSupabaseServer();
  const patch: any = { inicio: inicioISO }; if (duracaoMin != null) patch.duracao_min = duracaoMin;
  const { error } = await sb.from("eventos_calendario").update(patch).eq("id", eventoId);
  if (error) return { ok: false, erro: "Falha ao reagendar." };
  revalidatePath("/app/planejamento"); revalidatePath("/app/calendario");
  return { ok: true };
}

// Cria uma demanda INTERNA (sem solicitação externa) já entrando no fluxo de Demandas.
export async function criarDemandaInterna(dados: {
  titulo: string; tipo: string; area?: string; prioridade?: string; prazo?: string; briefing?: string;
  secretariaId?: string; responsavelId?: string; membros?: string[]; dataPlanejamento?: string; observacoes?: string; campanha?: boolean;
}) {
  const ator = await getAtor(); if (!ator || !podePlanejar(ator.cargos)) return { ok: false, erro: "Apenas Diretor/Coordenador/Social Media criam demandas internas." };
  if (!dados.titulo?.trim()) return { ok: false, erro: "Informe o título." };
  const sb = createSupabaseServer();
  const { data: dem, error: e1 } = await sb.from("demandas").insert({
    titulo: dados.titulo, campanha: !!dados.campanha, briefing_consolidado: dados.briefing ?? null,
    prioridade: dados.prioridade ?? "media", secretaria_id: dados.secretariaId ?? null,
  }).select("id").single();
  if (e1 || !dem) return { ok: false, erro: "Falha ao criar demanda." };
  const etapa = dados.responsavelId ? "criacao" : "distribuicao";
  const { data: sub, error: e2 } = await sb.from("subdemandas").insert({
    demanda_id: dem.id, titulo: dados.titulo, tipo: dados.tipo || "digital", area: dados.area ?? null,
    prioridade: dados.prioridade ?? "media", prazo: dados.prazo || null, secretaria_id: dados.secretariaId ?? null,
    responsavel_id: dados.responsavelId ?? null, observacoes: dados.observacoes ?? null,
    etapa, macroetapa: etapa === "criacao" ? "producao" : "planejamento",
  }).select("id").single();
  if (e2 || !sub) return { ok: false, erro: "Demanda criada, mas falhou a subdemanda." };
  for (const m of dados.membros ?? []) await sb.from("subdemanda_membros").insert({ subdemanda_id: sub.id, usuario_id: m });
  if (dados.dataPlanejamento) await sb.from("eventos_calendario").insert({ subdemanda_id: sub.id, titulo: dados.titulo, inicio: dados.dataPlanejamento, canal: dados.tipo, status: "planejado" });
  await sb.from("auditoria").insert({ entidade: "demanda", entidade_id: dem.id, acao: "criada_interna", autor_id: ator.id });
  const envolvidos = [...(dados.responsavelId ? [dados.responsavelId] : []), ...(dados.membros ?? [])].filter((id) => id !== ator.id);
  if (envolvidos.length) await notificarUsuarios(envolvidos, "atribuicao", `Você foi atribuído à demanda: ${dados.titulo}`, `/app/demandas/${sub.id}`);
  revalidatePath("/app/planejamento"); revalidatePath("/app/demandas");
  return { ok: true, subId: sub.id };
}
