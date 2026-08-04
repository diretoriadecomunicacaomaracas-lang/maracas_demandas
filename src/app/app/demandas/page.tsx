import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { listarSubdemandasComEquipe } from "@/server/data/demandas";
import { StatusChip, AtrasoChip } from "@/components/ui/StatusChip";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { PriorityChip } from "@/components/ui/Priority";
import { LinhaDemanda } from "@/components/interno/LinhaDemanda";
import { atrasoDias } from "@/domain/rules";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DemandasPage() {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  const subs = await listarSubdemandasComEquipe();
  return (
    <AppShell atual="demandas" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div><h1 className="text-[22px] font-bold">Demandas</h1><p className="text-neutro-text2 text-[13px]">Todas as demandas ativas</p></div>
        <div className="flex-1" />
        <div className="inline-flex bg-neutro-surface2 border border-neutro-border rounded-[10px] p-[3px]">
          <span className="h-8 px-3 grid place-items-center rounded-lg bg-white text-marca-azul font-semibold text-[13px]">Tabela</span>
          <Link href="/app/demandas/kanban" className="h-8 px-3 grid place-items-center rounded-lg text-neutro-text2 font-semibold text-[13px]">Kanban</Link>
        </div>
      </div>
      {subs.length === 0 ? (
        <div className="bg-white border border-neutro-border rounded-xl p-8 text-center text-neutro-text2">Nenhuma demanda ativa. Aprove uma solicitação na Central para gerar demandas.</div>
      ) : (
        <div className="bg-white border border-neutro-border rounded-2xl overflow-x-auto">
          <table className="w-full text-[13.5px] min-w-[820px]">
            <thead><tr className="bg-neutro-surface2 text-left text-[11px] uppercase text-neutro-text2">
              <th className="p-3">Elemento</th><th className="p-3">Tipo</th><th className="p-3">Responsável</th><th className="p-3">Prioridade</th><th className="p-3">Status</th><th className="p-3">Prazo</th></tr></thead>
            <tbody>{subs.map((s: any) => {
              const dias = atrasoDias(s.prazo, s.macroetapa);
              return (<LinhaDemanda key={s.id} id={s.id}>
                <td className="p-3"><Link href={`/app/demandas/${s.id}`} className="font-semibold text-neutro-text hover:text-marca-azul">{s.titulo}</Link></td>
                <td className="p-3"><span className="text-[11px] bg-neutro-surface2 border border-neutro-border rounded px-2 py-0.5 capitalize">{s.tipo}</span></td>
                <td className="p-3">
                  {(s.responsavel || s.membros.length > 0)
                    ? <AvatarStack pessoas={[...(s.responsavel ? [s.responsavel] : []), ...s.membros]} max={5} />
                    : <span title="Aguardando distribuição" aria-label="Aguardando distribuição" className="inline-grid place-items-center w-[26px] h-[26px] rounded-full border border-dashed border-neutro-border text-neutro-text3 text-[12px]">?</span>}
                </td>
                <td className="p-3"><PriorityChip prioridade={s.prioridade} /></td>
                <td className="p-3"><StatusChip status={s.etapa} /> {dias > 0 && <AtrasoChip dias={dias} />}</td>
                <td className="p-3">{s.prazo ? new Date(s.prazo).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"}</td>
              </LinhaDemanda>);
            })}</tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
