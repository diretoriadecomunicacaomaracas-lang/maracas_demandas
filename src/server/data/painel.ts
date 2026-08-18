import { createSupabaseServer } from "@/lib/supabase-server";
import { atrasoDias } from "@/domain/rules";

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
  // Atrasadas: calculado (não é status) — busca ativas com prazo e conta as vencidas.
  const { data: ativas } = await sb.from("subdemandas").select("prazo,macroetapa").eq("situacao", "ativa");
  const atrasadas = (ativas ?? []).filter((s: any) => atrasoDias(s.prazo, s.macroetapa) > 0).length;
  return {
    novas: novas.count ?? 0, andamento: andamento.count ?? 0, aprovacao: aprovacao.count ?? 0,
    atrasadas, pubHoje: pubHoje.count ?? 0, pub7: pub7.count ?? 0,
    impAprov: impAprov.count ?? 0, impProd: impProd.count ?? 0,
  };
}
