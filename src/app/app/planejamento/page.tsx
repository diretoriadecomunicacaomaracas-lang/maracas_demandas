import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { backlogPlanejamento, eventosPlanejamento } from "@/server/data/planejamento";
import { listarInternos } from "@/server/data/usuarios";
import { createSupabaseServer } from "@/lib/supabase-server";
import { podePlanejar } from "@/lib/permissions";
import { NovaDemandaBtn } from "@/components/interno/planejamento/NovaDemandaBtn";
import { Backlog } from "@/components/interno/planejamento/Backlog";
import { CalendarioMes } from "@/components/interno/CalendarioMes";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PlanejamentoPage({ searchParams }: { searchParams: { ano?: string; mes?: string } }) {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  const podeEditar = podePlanejar(ator.cargos);
  const hoje = new Date();
  const ano = Number(searchParams.ano ?? hoje.getFullYear());
  const mes = Number(searchParams.mes ?? hoje.getMonth());
  const de = new Date(ano, mes, 1).toISOString();
  const ate = new Date(ano, mes + 1, 0, 23, 59, 59).toISOString();

  const sb = createSupabaseServer();
  const [backlog, eventos, internos, { data: secs }] = await Promise.all([
    backlogPlanejamento(), eventosPlanejamento(de, ate), listarInternos(),
    sb.from("secretarias").select("id,nome").is("deleted_at", null).order("nome"),
  ]);
  const secretarias = (secs ?? []).map((s: any) => ({ id: s.id, nome: s.nome }));
  const internosOpt = (internos ?? []).map((u: any) => ({ id: u.id, nome: u.nome, funcao: u.funcao }));

  return (
    <AppShell atual="planejamento" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold">Planejamento</h1>
          <p className="text-neutro-text2 text-[13px]">Organize solicitações aprovadas, demandas internas e a agenda editorial.</p>
        </div>
        <div className="flex-1" />
        {podeEditar
          ? <NovaDemandaBtn secretarias={secretarias} internos={internosOpt} />
          : <span className="text-[12px] text-neutro-text3">Somente leitura (sem permissão para editar o Planejamento)</span>}
      </div>
      <div className="grid gap-4 items-start grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 order-2 lg:order-1">
          <CalendarioMes eventos={eventos as any} ano={ano} mes={mes} basePath="/app/planejamento" />
        </div>
        <div className="order-1 lg:order-2"><Backlog itens={backlog} podeEditar={podeEditar} /></div>
      </div>
    </AppShell>
  );
}
