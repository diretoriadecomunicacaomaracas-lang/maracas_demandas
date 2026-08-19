import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { listarFinalizadas, listarLixeira } from "@/server/data/demandas";
import { EmptyState } from "@/components/ui/EmptyState";
import { RestaurarBtn } from "@/components/interno/RestaurarBtn";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";
const dias = (iso: string | null) => { if (!iso) return null; const d = 30 - Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); return Math.max(0, d); };

export default async function Arquivadas({ searchParams }: { searchParams: { tab?: string } }) {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  const tab = searchParams.tab === "lixeira" ? "lixeira" : "arquivadas";
  const podeRestaurar = can(ator.cargos, "excluir_logico");
  const [finalizadas, lixeira] = await Promise.all([
    tab === "arquivadas" ? listarFinalizadas() : Promise.resolve([]),
    tab === "lixeira" ? listarLixeira() : Promise.resolve([]),
  ]);

  return (
    <AppShell atual="arquivadas" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="mb-3"><h1 className="text-[22px] font-bold">Arquivadas</h1>
        <p className="text-neutro-text2 text-[13px]">Concluídas/arquivadas e itens excluídos (Lixeira, retenção de 30 dias).</p></div>
      <div className="inline-flex bg-neutro-surface2 border border-neutro-border rounded-[10px] p-[3px] mb-4">
        {[["arquivadas", "Arquivadas"], ["lixeira", "Lixeira"]].map(([v, lab]) => (
          <Link key={v} href={`/app/arquivadas?tab=${v}`} className={`h-8 px-3 grid place-items-center rounded-lg font-semibold text-[13px] ${tab === v ? "bg-white text-marca-azul" : "text-neutro-text2"}`}>{lab}</Link>
        ))}
      </div>

      {tab === "arquivadas" && ((finalizadas as any[]).length === 0
        ? <EmptyState icone="🗀" titulo="Nada arquivado" descricao="Demandas concluídas/arquivadas aparecem aqui." />
        : <div className="card overflow-x-auto anim-in"><table className="w-full text-[13.5px] min-w-[680px]">
          <thead><tr className="bg-neutro-surface2 text-left text-[11px] uppercase text-neutro-text2"><th className="p-3">Elemento</th><th className="p-3">Tipo</th><th className="p-3">Secretaria</th><th className="p-3">Situação</th><th className="p-3">Data final</th></tr></thead>
          <tbody>{(finalizadas as any[]).map((s) => (
            <tr key={s.id} className="border-t border-neutro-border hover:bg-neutro-surface2/60">
              <td className="p-3"><Link href={`/app/demandas/${s.id}`} className="font-semibold hover:text-marca-azul">{s.titulo}</Link></td>
              <td className="p-3 capitalize">{s.tipo}</td><td className="p-3">{s.secretariaNome ?? "—"}</td>
              <td className="p-3">{s.situacao === "arquivada" ? "Arquivada" : "Finalizada"}</td>
              <td className="p-3">{s.updated_at ? new Date(s.updated_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"}</td>
            </tr>))}</tbody></table></div>)}

      {tab === "lixeira" && ((lixeira as any[]).length === 0
        ? <EmptyState icone="🗑" titulo="Lixeira vazia" descricao="Itens excluídos logicamente aparecem aqui por 30 dias." />
        : <div className="card overflow-x-auto anim-in"><table className="w-full text-[13.5px] min-w-[760px]">
          <thead><tr className="bg-neutro-surface2 text-left text-[11px] uppercase text-neutro-text2"><th className="p-3">Item</th><th className="p-3">Excluído por</th><th className="p-3">Motivo</th><th className="p-3">Quando</th><th className="p-3">Retenção</th><th className="p-3"></th></tr></thead>
          <tbody>{(lixeira as any[]).map((s) => { const d = dias(s.deleted_at ?? s.quando); return (
            <tr key={s.id} className="border-t border-neutro-border">
              <td className="p-3 font-semibold">{s.titulo} <span className="text-[11px] text-neutro-text3 capitalize">· {s.tipo}</span></td>
              <td className="p-3">{s.excluidoPor}</td><td className="p-3 text-neutro-text2">{s.motivo}</td>
              <td className="p-3">{s.quando ? new Date(s.quando).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"}</td>
              <td className="p-3">{d === null ? "—" : d === 0 ? <span className="text-[#B32219] font-semibold">exclusão iminente</span> : `Exclusão definitiva em ${d} dia(s)`}</td>
              <td className="p-3">{podeRestaurar && <RestaurarBtn subId={s.id} />}</td>
            </tr>); })}</tbody></table></div>)}
    </AppShell>
  );
}
