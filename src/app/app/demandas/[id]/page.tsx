import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { getSubdemandaCompleta } from "@/server/data/demandas";
import { listarVersoes } from "@/server/data/versoes";
import { listarLinks } from "@/server/data/links";
import { listarChecklist } from "@/server/data/checklist";
import { listarComentarios } from "@/server/data/comentarios";
import { listarInternos } from "@/server/data/usuarios";
import { createSupabaseServer } from "@/lib/supabase-server";
import { PaginaTarefa } from "@/components/interno/tarefa/PaginaTarefa";
import { can } from "@/lib/permissions";
import { redirect, notFound } from "next/navigation";

export default async function DemandaDetalhe({ params }: { params: { id: string } }) {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  const sub = await getSubdemandaCompleta(params.id); if (!sub) notFound();
  const sb = createSupabaseServer();
  const [versoes, links, checklist, comentarios, internos] = await Promise.all([
    listarVersoes(params.id), listarLinks(params.id), listarChecklist(params.id), listarComentarios(params.id), listarInternos(),
  ]);
  const { data: aprovacoes } = await sb.from("aprovacoes").select("versao_id,cargo_chave,decisao,ativa,created_at").in("versao_id", versoes.map((v: any) => v.id).length ? versoes.map((v: any) => v.id) : ["_"]);
  const { data: pedido } = await sb.from("pedidos_impressao").select("*").eq("subdemanda_id", params.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { data: hist } = await sb.from("auditoria").select("acao,autor_id,created_at,justificativa,valor_anterior,valor_novo").eq("entidade_id", params.id).order("created_at", { ascending: false }).limit(60);
  const perms = {
    podeAprovarDigital: can(ator.cargos, "aprovar_digital"), podeAprovarImpresso: can(ator.cargos, "aprovar_impresso"),
    podeOperacional: can(ator.cargos, "editar_operacional"), podeDistribuir: can(ator.cargos, "editar_admin_demanda"),
    readonly: ator.cargos.length === 1 && ator.cargos[0] === "visualizador",
  };
  return (
    <AppShell atual="demandas" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <PaginaTarefa sub={sub as any} versoes={versoes as any} aprovacoes={(aprovacoes ?? []) as any} pedido={pedido as any}
        historico={(hist ?? []) as any} links={links as any} checklist={checklist as any} comentarios={comentarios as any}
        internos={internos as any} meId={ator.id} perms={perms} />
    </AppShell>
  );
}
