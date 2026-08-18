import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { listarSubdemandasComEquipe, listarFinalizadas } from "@/server/data/demandas";
import { createSupabaseServer } from "@/lib/supabase-server";
import { KanbanBoard } from "@/components/interno/KanbanBoard";
import { StatusChip, AtrasoChip } from "@/components/ui/StatusChip";
import { AvatarStack } from "@/components/ui/Avatar";
import { PriorityChip } from "@/components/ui/Priority";
import { LinhaDemanda } from "@/components/interno/LinhaDemanda";
import { EmptyState } from "@/components/ui/EmptyState";
import { atrasoDias } from "@/domain/rules";
import { grupoDaSecretaria } from "@/domain/secretarias";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";
const APROV = ["aprovacao", "aprov_coord", "aprov_dir"];
const ROTULO_FILTRO: Record<string, string> = { atrasadas: "Atrasadas", aprovacao: "Aguardando aprovação", sem_responsavel: "Sem responsável" };

export default async function DemandasPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  const sp = searchParams;
  const view = sp.view === "tabela" || sp.view === "finalizadas" ? sp.view : "kanban";

  const subs = await listarSubdemandasComEquipe();
  let mSec = new Map<string, string>();
  if (sp.grupo) {
    const sb = createSupabaseServer();
    const { data: secs } = await sb.from("secretarias").select("id,nome");
    mSec = new Map((secs ?? []).map((s: any) => [s.id, s.nome] as [string, string]));
  }
  const filtrada = (subs as any[]).filter((s) => {
    if (sp.filtro === "atrasadas" && !(atrasoDias(s.prazo, s.macroetapa) > 0)) return false;
    if (sp.filtro === "aprovacao" && !APROV.includes(s.etapa)) return false;
    if (sp.filtro === "sem_responsavel" && !(!s.responsavel_id && s.etapa !== "distribuicao")) return false;
    if (sp.prof && !(s.responsavel_id === sp.prof || (s.membros ?? []).some((m: any) => m.id === sp.prof))) return false;
    if (sp.tipo && s.tipo !== sp.tipo) return false;
    if (sp.status && s.etapa !== sp.status) return false;
    if (sp.secretaria && s.secretaria_id !== sp.secretaria) return false;
    if (sp.grupo && grupoDaSecretaria(mSec.get(s.secretaria_id)).chave !== sp.grupo) return false;
    return true;
  });
  const filtroAtivo = sp.filtro || sp.prof || sp.tipo || sp.status || sp.secretaria || sp.grupo;
  const rotulo = sp.filtro ? ROTULO_FILTRO[sp.filtro] ?? sp.filtro : filtroAtivo ? "Filtro aplicado" : "";
  const qs = (v: string) => { const p = new URLSearchParams(); for (const [k, val] of Object.entries(sp)) if (val && k !== "view") p.set(k, val); p.set("view", v); return `/app/demandas?${p.toString()}`; };
  const finalizadas = view === "finalizadas" ? await listarFinalizadas() : [];

  return (
    <AppShell atual="demandas" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold">Demandas</h1>
          <p className="text-neutro-text2 text-[13px]">{view === "kanban" ? "Arraste os cartões entre as etapas" : view === "finalizadas" ? "Arquivo — concluídas e arquivadas" : "Tabela de demandas ativas"}{filtroAtivo ? " · filtro ativo" : ""}</p>
        </div>
        {filtroAtivo && <Link href={`/app/demandas?view=${view}`} className="text-[13px] font-semibold tone-azul px-2.5 py-1 rounded-full pressable">{rotulo} ✕</Link>}
        <div className="flex-1" />
        <div className="inline-flex bg-neutro-surface2 border border-neutro-border rounded-[10px] p-[3px]">
          {[["kanban", "Kanban"], ["tabela", "Tabela"], ["finalizadas", "Finalizadas"]].map(([v, lab]) => (
            <Link key={v} href={qs(v)} className={`h-8 px-3 grid place-items-center rounded-lg font-semibold text-[13px] ${view === v ? "bg-white text-marca-azul" : "text-neutro-text2"}`}>{lab}</Link>
          ))}
        </div>
      </div>

      {view === "kanban" && (filtrada.length === 0
        ? <EmptyState icone="▤" titulo={filtroAtivo ? "Nada com esse filtro" : "Nenhuma demanda ativa"} descricao={filtroAtivo ? "Ajuste ou limpe o filtro." : "Crie no Planejamento ou aprove uma solicitação."} />
        : <KanbanBoard subs={filtrada as any} />)}

      {view === "tabela" && (filtrada.length === 0
        ? <EmptyState icone="▤" titulo="Nada aqui" descricao="Sem demandas para os filtros atuais." />
        : <div className="card overflow-x-auto anim-in">
          <table className="w-full text-[13.5px] min-w-[820px]">
            <thead><tr className="bg-neutro-surface2 text-left text-[11px] uppercase text-neutro-text2">
              <th className="p-3">Elemento</th><th className="p-3">Tipo</th><th className="p-3">Responsável</th><th className="p-3">Prioridade</th><th className="p-3">Status</th><th className="p-3">Prazo</th></tr></thead>
            <tbody>{filtrada.map((s: any) => {
              const dias = atrasoDias(s.prazo, s.macroetapa);
              return (<LinhaDemanda key={s.id} id={s.id}>
                <td className="p-3"><Link href={`/app/demandas/${s.id}`} className="font-semibold text-neutro-text hover:text-marca-azul">{s.titulo}</Link></td>
                <td className="p-3"><span className="text-[11px] bg-neutro-surface2 border border-neutro-border rounded px-2 py-0.5 capitalize">{s.tipo}</span></td>
                <td className="p-3">{(s.responsavel || s.membros.length > 0) ? <AvatarStack pessoas={[...(s.responsavel ? [s.responsavel] : []), ...s.membros]} max={5} /> : <span title="Aguardando distribuição" className="inline-grid place-items-center w-[26px] h-[26px] rounded-full border border-dashed border-neutro-border text-neutro-text3 text-[12px]">?</span>}</td>
                <td className="p-3"><PriorityChip prioridade={s.prioridade} /></td>
                <td className="p-3"><StatusChip status={s.etapa} /> {dias > 0 && <AtrasoChip dias={dias} />}</td>
                <td className="p-3">{s.prazo ? new Date(s.prazo).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"}</td>
              </LinhaDemanda>);
            })}</tbody>
          </table>
        </div>)}

      {view === "finalizadas" && (finalizadas.length === 0
        ? <EmptyState icone="✓" titulo="Nada finalizado" descricao="Demandas concluídas/arquivadas aparecerão aqui." />
        : <div className="card overflow-x-auto anim-in">
          <table className="w-full text-[13.5px] min-w-[720px]">
            <thead><tr className="bg-neutro-surface2 text-left text-[11px] uppercase text-neutro-text2">
              <th className="p-3">Elemento</th><th className="p-3">Tipo</th><th className="p-3">Secretaria</th><th className="p-3">Situação</th><th className="p-3">Atualizada</th></tr></thead>
            <tbody>{(finalizadas as any[]).map((s) => (
              <tr key={s.id} className="border-t border-neutro-border hover:bg-neutro-surface2/60">
                <td className="p-3"><Link href={`/app/demandas/${s.id}`} className="font-semibold hover:text-marca-azul">{s.titulo}</Link></td>
                <td className="p-3 capitalize">{s.tipo}</td>
                <td className="p-3">{s.secretariaNome ?? "—"}</td>
                <td className="p-3">{s.situacao === "arquivada" ? "Arquivada" : "Finalizada"}</td>
                <td className="p-3">{s.updated_at ? new Date(s.updated_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>)}
    </AppShell>
  );
}
