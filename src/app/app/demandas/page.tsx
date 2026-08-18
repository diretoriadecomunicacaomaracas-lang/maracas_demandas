import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { listarSubdemandasComEquipe } from "@/server/data/demandas";
import { createSupabaseServer } from "@/lib/supabase-server";
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
  const subs = await listarSubdemandasComEquipe();

  const sp = searchParams;
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

  return (
    <AppShell atual="demandas" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold">Demandas</h1>
          <p className="text-neutro-text2 text-[13px]">{filtroAtivo ? `${filtrada.length} demanda(s) · filtro ativo` : "Todas as demandas ativas"}</p>
        </div>
        {filtroAtivo && <Link href="/app/demandas" className="text-[13px] font-semibold tone-azul px-2.5 py-1 rounded-full pressable">{rotulo} ✕</Link>}
        <div className="flex-1" />
        <div className="inline-flex bg-neutro-surface2 border border-neutro-border rounded-[10px] p-[3px]">
          <span className="h-8 px-3 grid place-items-center rounded-lg bg-white text-marca-azul font-semibold text-[13px]">Tabela</span>
          <Link href="/app/demandas/kanban" className="h-8 px-3 grid place-items-center rounded-lg text-neutro-text2 font-semibold text-[13px]">Kanban</Link>
        </div>
      </div>
      {filtrada.length === 0 ? (
        <EmptyState icone="▤" titulo={filtroAtivo ? "Nada com esse filtro" : "Nenhuma demanda ativa"}
          descricao={filtroAtivo ? "Ajuste ou limpe o filtro." : "Aprove uma solicitação na Central para gerar demandas."} />
      ) : (
        <div className="card overflow-x-auto anim-in">
          <table className="w-full text-[13.5px] min-w-[820px]">
            <thead><tr className="bg-neutro-surface2 text-left text-[11px] uppercase text-neutro-text2">
              <th className="p-3">Elemento</th><th className="p-3">Tipo</th><th className="p-3">Responsável</th><th className="p-3">Prioridade</th><th className="p-3">Status</th><th className="p-3">Prazo</th></tr></thead>
            <tbody>{filtrada.map((s: any) => {
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
