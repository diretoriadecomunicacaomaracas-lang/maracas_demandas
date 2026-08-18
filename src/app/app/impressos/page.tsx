import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { createSupabaseServer } from "@/lib/supabase-server";
import { StatTile } from "@/components/ui/StatTile";
import { SectionCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const BUCKETS: { label: string; etapas: string[]; href: string; tom: any }[] = [
  { label: "Aguardando criação", etapas: ["planejamento", "distribuicao"], href: "/app/demandas?tipo=impresso&status=planejamento", tom: "amarelo" },
  { label: "Em criação", etapas: ["criacao"], href: "/app/demandas?tipo=impresso&status=criacao", tom: "laranja" },
  { label: "Em revisão", etapas: ["revisao"], href: "/app/demandas?tipo=impresso&status=revisao", tom: "ciano" },
  { label: "Aguardando Coordenação", etapas: ["aprov_coord"], href: "/app/demandas?tipo=impresso&status=aprov_coord", tom: "laranjaverm" },
  { label: "Aguardando Direção", etapas: ["aprov_dir"], href: "/app/demandas?tipo=impresso&status=aprov_dir", tom: "laranjaverm" },
  { label: "Liberados p/ gráfica", etapas: ["aprov_dois", "liberado_imp"], href: "/app/demandas?tipo=impresso&status=liberado_imp", tom: "verde" },
  { label: "Na gráfica", etapas: ["conf_grafica", "pedido_conf", "prod_grafica", "pronto", "transporte"], href: "/app/demandas?tipo=impresso", tom: "laranja" },
  { label: "Finalizados", etapas: ["finalizado", "entregue", "conferido"], href: "/app/demandas?view=finalizadas&tipo=impresso", tom: "neutro" },
];

export default async function ImpressosPage() {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  const sb = createSupabaseServer();
  const [{ data: subs }, { data: pedidos }, { data: graficas }] = await Promise.all([
    sb.from("subdemandas").select("id,etapa").eq("tipo", "impresso").eq("situacao", "ativa").is("deleted_at", null),
    sb.from("pedidos_impressao").select("id,grafica_id,status,prazo,subdemanda_id"),
    sb.from("graficas").select("id,nome,ativa"),
  ]);
  const conta = (etapas: string[]) => (subs ?? []).filter((s: any) => etapas.includes(s.etapa)).length;
  const mGraf = new Map((graficas ?? []).map((g: any) => [g.id, g.nome] as [string, string]));
  const porGrafica = new Map<string, { nome: string; total: number; emProducao: number }>();
  for (const p of pedidos ?? []) {
    const nome = mGraf.get(p.grafica_id) ?? "Sem gráfica";
    const e = porGrafica.get(p.grafica_id ?? "—") ?? { nome, total: 0, emProducao: 0 };
    e.total++; if (["prod_grafica", "aguardando_confirmacao", "confirmado"].includes(p.status)) e.emProducao++;
    porGrafica.set(p.grafica_id ?? "—", e);
  }

  return (
    <AppShell atual="impressos" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="mb-4"><h1 className="text-[22px] font-bold">Impressos</h1>
        <p className="text-neutro-text2 text-[13px]">Visão gerencial do fluxo de impressos e das gráficas.</p></div>
      <div className="grid gap-3 stagger mb-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        {BUCKETS.map((b) => <StatTile key={b.label} label={b.label} valor={conta(b.etapas)} href={b.href} tom={b.tom} />)}
      </div>
      <SectionCard titulo="Por gráfica" icone="🖶">
        {porGrafica.size === 0 ? <EmptyState icone="🖶" titulo="Nenhum pedido" descricao="Ainda não há pedidos de impressão." />
          : <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[420px]">
              <thead><tr className="text-left text-[11px] uppercase text-neutro-text3"><th className="py-1">Gráfica</th><th className="py-1">Pedidos</th><th className="py-1">Em produção</th></tr></thead>
              <tbody>{[...porGrafica.values()].map((g, i) => (
                <tr key={i} className="border-t border-neutro-border"><td className="py-2 font-medium">{g.nome}</td><td className="py-2 tabular-nums">{g.total}</td><td className="py-2 tabular-nums">{g.emProducao}</td></tr>
              ))}</tbody>
            </table>
          </div>}
      </SectionCard>
    </AppShell>
  );
}
