import { createSupabaseServer } from "@/lib/supabase-server";
import { atrasoDias } from "@/domain/rules";
import { agruparPorSecretaria } from "@/domain/secretarias";
import { cargaElevada } from "@/domain/carga";

// Indicadores reais do Painel (contagens no banco; RLS aplica visibilidade).
export async function indicadoresPainel() {
  const sb = createSupabaseServer();
  const hoje = new Date(); const em7 = new Date(Date.now() + 7 * 86400e3);
  const ini = new Date(hoje); ini.setHours(0, 0, 0, 0); const fim = new Date(hoje); fim.setHours(23, 59, 59, 999);
  const [novas, andamento, aprovacao, pubHoje, pub7, impAprov, impProd] = await Promise.all([
    sb.from("solicitacoes").select("*", { count: "exact", head: true }).eq("status_externo", "enviada"),
    sb.from("subdemandas").select("*", { count: "exact", head: true }).eq("situacao", "ativa"),
    sb.from("subdemandas").select("*", { count: "exact", head: true }).in("etapa", ["aprovacao", "aprov_coord", "aprov_dir"]),
    sb.from("eventos_calendario").select("*", { count: "exact", head: true }).gte("inicio", ini.toISOString()).lte("inicio", fim.toISOString()),
    sb.from("eventos_calendario").select("*", { count: "exact", head: true }).gt("inicio", fim.toISOString()).lte("inicio", em7.toISOString()),
    sb.from("subdemandas").select("*", { count: "exact", head: true }).eq("tipo", "impresso").in("etapa", ["aprov_coord", "aprov_dir"]),
    sb.from("subdemandas").select("*", { count: "exact", head: true }).eq("tipo", "impresso").in("etapa", ["prod_grafica", "transporte"]),
  ]);
  const { data: ativas } = await sb.from("subdemandas").select("prazo,macroetapa").eq("situacao", "ativa");
  const atrasadas = (ativas ?? []).filter((s: any) => atrasoDias(s.prazo, s.macroetapa) > 0).length;
  return {
    novas: novas.count ?? 0, andamento: andamento.count ?? 0, aprovacao: aprovacao.count ?? 0,
    atrasadas, pubHoje: pubHoje.count ?? 0, pub7: pub7.count ?? 0,
    impAprov: impAprov.count ?? 0, impProd: impProd.count ?? 0,
  };
}

// ---------------------------------------------------------------------
// Painel operacional completo (dados reais; nada simulado).
// ---------------------------------------------------------------------
export type ItemPainel = { id: string; titulo: string; url: string; quando: string | null; secretariaNome: string | null; etapa: string | null; prioridade?: string | null };
export type Alerta = { texto: string; url: string; tom: "vermelho" | "amarelo" | "laranja" | "azul" };
export type CargaItem = { id: string; nome: string; ativas: number; atrasadas: number; vencendo: number; elevada: boolean; motivo: string | null };
export type Serie = { chave: string; nome: string; total: number };

const APROV = ["aprovacao", "aprov_coord", "aprov_dir"];
const TERMINAIS = ["finalizado", "cancelado", "concluido"];
const mesLabel = (d: Date) => d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "America/Sao_Paulo" });

export async function dadosPainel() {
  const sb = createSupabaseServer();
  const agora = new Date();
  const hojeIni = new Date(agora); hojeIni.setHours(0, 0, 0, 0);
  const hojeFim = new Date(agora); hojeFim.setHours(23, 59, 59, 999);
  const amanhaIni = new Date(hojeIni); amanhaIni.setDate(amanhaIni.getDate() + 1);
  const amanhaFim = new Date(hojeFim); amanhaFim.setDate(amanhaFim.getDate() + 1);
  const em7 = new Date(hojeFim.getTime() + 7 * 86400e3);
  const em3 = new Date(hojeIni.getTime() + 3 * 86400e3);

  const [{ data: subs }, { data: sols }, { data: eventos }, { data: users }, { data: secs }, { data: dems }] = await Promise.all([
    sb.from("subdemandas").select("id,titulo,tipo,etapa,macroetapa,prazo,data_publicacao,responsavel_id,secretaria_id,situacao,created_at").is("deleted_at", null).limit(4000),
    sb.from("solicitacoes").select("id,secretaria_id,status_externo,created_at").is("deleted_at", null).limit(4000),
    sb.from("eventos_calendario").select("id,titulo,inicio,subdemanda_id,canal,status").gte("inicio", hojeIni.toISOString()).lte("inicio", em7.toISOString()).limit(500),
    sb.from("usuarios").select("id,nome,ambiente_principal").eq("ambiente_principal", "interno"),
    sb.from("secretarias").select("id,nome").is("deleted_at", null),
    sb.from("demandas").select("id,finalizada_em,secretaria_id").is("deleted_at", null).limit(4000),
  ]);

  const mSec = new Map((secs ?? []).map((s: any) => [s.id, s.nome] as [string, string]));
  const nomeSec = (id: any) => mSec.get(id) ?? null;
  const S = subs ?? [];
  const ativas = S.filter((s: any) => s.situacao === "ativa");
  const url = (s: any) => `/app/demandas/${s.id}`;
  const item = (s: any, quando: string | null): ItemPainel => ({ id: s.id, titulo: s.titulo, url: url(s), quando, secretariaNome: nomeSec(s.secretaria_id), etapa: s.etapa });
  const entre = (iso: any, a: Date, b: Date) => iso != null && new Date(iso) >= a && new Date(iso) <= b;

  // Indicadores (recalculados dos mesmos dados)
  const eventosHoje = (eventos ?? []).filter((e: any) => entre(e.inicio, hojeIni, hojeFim));
  const indicadores = {
    novas: (sols ?? []).filter((s: any) => s.status_externo === "enviada").length,
    andamento: ativas.length,
    aprovacao: ativas.filter((s: any) => APROV.includes(s.etapa)).length,
    atrasadas: ativas.filter((s: any) => atrasoDias(s.prazo, s.macroetapa) > 0).length,
    pubHoje: eventosHoje.length,
    pub7: (eventos ?? []).filter((e: any) => entre(e.inicio, amanhaIni, em7)).length,
    impAprov: ativas.filter((s: any) => s.tipo === "impresso" && ["aprov_coord", "aprov_dir"].includes(s.etapa)).length,
    impProd: ativas.filter((s: any) => s.tipo === "impresso" && ["prod_grafica", "transporte"].includes(s.etapa)).length,
  };

  // Operação de hoje
  const semResponsavel = ativas.filter((s: any) => !s.responsavel_id && s.etapa !== "distribuicao");
  const operacaoHoje = {
    prazosHoje: ativas.filter((s: any) => entre(s.prazo, hojeIni, hojeFim)).map((s: any) => item(s, s.prazo)),
    publicacoesHoje: ativas.filter((s: any) => entre(s.data_publicacao, hojeIni, hojeFim)).map((s: any) => item(s, s.data_publicacao)),
    gravacoesHoje: ativas.filter((s: any) => s.tipo === "audiovisual" && s.etapa === "gravacao" && entre(s.prazo, hojeIni, hojeFim)).map((s: any) => item(s, s.prazo)),
    eventosHoje: eventosHoje.map((e: any) => ({ id: e.id, titulo: e.titulo, inicio: e.inicio, canal: e.canal })),
    aprovacoesPendentes: ativas.filter((s: any) => APROV.includes(s.etapa)).length,
    atrasadas: ativas.filter((s: any) => atrasoDias(s.prazo, s.macroetapa) > 0).map((s: any) => item(s, s.prazo)),
    semResponsavel: semResponsavel.map((s: any) => item(s, s.prazo)),
  };

  // Próximos 7 dias
  const prox7 = {
    publicacoes: ativas.filter((s: any) => entre(s.data_publicacao, amanhaIni, em7)).map((s: any) => item(s, s.data_publicacao)),
    gravacoes: ativas.filter((s: any) => s.tipo === "audiovisual" && entre(s.prazo, amanhaIni, em7)).map((s: any) => item(s, s.prazo)),
    prazos: ativas.filter((s: any) => entre(s.prazo, amanhaIni, em7)).map((s: any) => item(s, s.prazo)),
    eventos: (eventos ?? []).filter((e: any) => entre(e.inicio, amanhaIni, em7)).map((e: any) => ({ id: e.id, titulo: e.titulo, inicio: e.inicio, canal: e.canal })),
  };

  // Carga da equipe (por responsável)
  const carga: CargaItem[] = (users ?? []).map((u: any) => {
    const minhas = ativas.filter((s: any) => s.responsavel_id === u.id);
    const atrasadas = minhas.filter((s: any) => atrasoDias(s.prazo, s.macroetapa) > 0).length;
    const vencendo = minhas.filter((s: any) => entre(s.prazo, agora, em3) && atrasoDias(s.prazo, s.macroetapa) === 0).length;
    const { elevada, motivo } = cargaElevada({ ativas: minhas.length, atrasadas });
    return { id: u.id, nome: u.nome, ativas: minhas.length, atrasadas, vencendo, elevada, motivo };
  }).sort((a, b) => b.ativas - a.ativas);
  const semDemanda = carga.filter((c) => c.ativas === 0).map((c) => c.nome);
  const aguardandoDistribuicao = ativas.filter((s: any) => s.etapa === "distribuicao").length;

  // Distribuição por secretaria (7 grupos oficiais)
  const contarPorSec = (linhas: any[]) => {
    const m = new Map<string, number>();
    for (const l of linhas) { const nome = nomeSec(l.secretaria_id) ?? "—"; m.set(nome, (m.get(nome) ?? 0) + 1); }
    return agruparPorSecretaria([...m.entries()].map(([nome, total]) => ({ nome, total })));
  };
  const secretarias = {
    solicitacoes: contarPorSec(sols ?? []),
    demandas: contarPorSec(ativas),
    publicacoes: contarPorSec(ativas.filter((s: any) => s.data_publicacao)),
  };

  // Gráficos
  const porTipo: Serie[] = ["digital", "audiovisual", "impresso"].map((t) => ({ chave: t, nome: t[0].toUpperCase() + t.slice(1), total: ativas.filter((s: any) => s.tipo === t).length }));
  const statusOrdem = [["planejamento", "Planejamento"], ["producao", "Produção"], ["aprovacao", "Aprovação"], ["finalizado", "Finalizado"]];
  const macroDe = (s: any) => APROV.includes(s.etapa) ? "aprovacao" : (s.macroetapa || "planejamento");
  const distribuicaoStatus: Serie[] = statusOrdem.map(([k, nome]) => ({ chave: k, nome, total: ativas.filter((s: any) => macroDe(s) === k).length }));
  // Últimos 6 meses
  const meses: { chave: string; nome: string; ini: Date; fim: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const f = new Date(agora.getFullYear(), agora.getMonth() - i + 1, 0, 23, 59, 59);
    meses.push({ chave: `${d.getFullYear()}-${d.getMonth()}`, nome: mesLabel(d), ini: d, fim: f });
  }
  const volumeMensal: Serie[] = meses.map((m) => ({ chave: m.chave, nome: m.nome, total: S.filter((s: any) => entre(s.created_at, m.ini, m.fim)).length }));
  const concluidasPorMes: Serie[] = meses.map((m) => ({ chave: m.chave, nome: m.nome, total: (dems ?? []).filter((d: any) => entre(d.finalizada_em, m.ini, m.fim)).length }));

  // Alertas (regras reais)
  const alertas: Alerta[] = [];
  if (semResponsavel.length) alertas.push({ texto: `${semResponsavel.length} demanda(s) sem responsável.`, url: "/app/demandas?filtro=sem_responsavel", tom: "laranja" });
  const pubAmanhaSemAprov = ativas.filter((s: any) => entre(s.data_publicacao, amanhaIni, amanhaFim) && APROV.includes(s.etapa));
  if (pubAmanhaSemAprov.length) alertas.push({ texto: `${pubAmanhaSemAprov.length} publicação(ões) de amanhã ainda aguardam aprovação.`, url: "/app/demandas?filtro=aprovacao", tom: "vermelho" });
  if (operacaoHoje.atrasadas.length) alertas.push({ texto: `${operacaoHoje.atrasadas.length} demanda(s) atrasada(s).`, url: "/app/demandas?filtro=atrasadas", tom: "vermelho" });
  for (const c of carga) if (c.vencendo >= 3) alertas.push({ texto: `${c.vencendo} tarefas de ${c.nome} vencem nos próximos 3 dias.`, url: `/app/demandas?prof=${c.id}`, tom: "amarelo" });
  for (const c of carga) if (c.elevada) alertas.push({ texto: `${c.nome} está com carga elevada (${c.motivo}).`, url: `/app/demandas?prof=${c.id}`, tom: "azul" });

  return { indicadores, operacaoHoje, prox7, carga, semDemanda, aguardandoDistribuicao, secretarias, graficos: { porTipo, distribuicaoStatus, volumeMensal, concluidasPorMes }, alertas };
}
