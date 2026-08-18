import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { listarSubdemandasComEquipe } from "@/server/data/demandas";
import { KanbanBoard } from "@/components/interno/KanbanBoard";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function KanbanPage() {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  const subs = await listarSubdemandasComEquipe();
  return (
    <AppShell atual="demandas" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div><h1 className="text-[22px] font-bold">Demandas — Kanban</h1><p className="text-neutro-text2 text-[13px]">Arraste os cartões entre as etapas</p></div>
        <div className="flex-1" />
        <div className="inline-flex bg-neutro-surface2 border border-neutro-border rounded-[10px] p-[3px]">
          <Link href="/app/demandas" className="h-8 px-3 grid place-items-center rounded-lg text-neutro-text2 font-semibold text-[13px]">Tabela</Link>
          <span className="h-8 px-3 grid place-items-center rounded-lg bg-white text-marca-azul font-semibold text-[13px]">Kanban</span>
        </div>
      </div>
      <KanbanBoard subs={subs as any} />
    </AppShell>
  );
}
