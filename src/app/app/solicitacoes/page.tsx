import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { listarCentral } from "@/server/data/solicitacoes";
import { EmptyState } from "@/components/ui/EmptyState";
import { redirect } from "next/navigation";
import Link from "next/link";

const ABAS = [
  { chave: "pendentes", nome: "Pendentes", status: ["enviada"] },
  { chave: "analise", nome: "Em análise", status: ["em_analise"] },
  { chave: "aguardando", nome: "Aguardando informações", status: ["aguardando_informacoes"] },
  { chave: "processadas", nome: "Processadas", status: ["aprovada_planejamento", "recusada", "cancelada"] },
  { chave: "todas", nome: "Todas", status: [] as string[] },
];
function tempoAguardando(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return `${min} min`; const h = Math.floor(min / 60); if (h < 24) return `${h} h`; return `${Math.floor(h / 24)} d`;
}
const rotuloStatus: Record<string, string> = { enviada: "Enviada", em_analise: "Em análise", aguardando_informacoes: "Aguardando informações", aprovada_planejamento: "Aprovada", recusada: "Recusada", cancelada: "Cancelada" };

export default async function Central({ searchParams }: { searchParams: { aba?: string } }) {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  const abaAtual = ABAS.find((a) => a.chave === (searchParams.aba ?? "pendentes")) ?? ABAS[0];
  const todas = await listarCentral();
  const lista = abaAtual.status.length ? todas.filter((s: any) => abaAtual.status.includes(s.status_externo)) : todas;
  const dtBR = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return (
    <AppShell atual="solicitacoes" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="mb-3"><h1 className="text-[22px] font-bold">Central de Solicitações</h1>
        <p className="text-neutro-text2 text-[13px]">Fila cronológica (mais antigas primeiro). Aprovar não apaga: a solicitação vira registro institucional.</p></div>
      <div className="inline-flex bg-neutro-surface2 border border-neutro-border rounded-[10px] p-[3px] mb-4 flex-wrap">
        {ABAS.map((a) => {
          const n = a.status.length ? todas.filter((s: any) => a.status.includes(s.status_externo)).length : todas.length;
          return <Link key={a.chave} href={`/app/solicitacoes?aba=${a.chave}`}
            className={`h-8 px-3 grid place-items-center rounded-lg font-semibold text-[13px] ${abaAtual.chave === a.chave ? "bg-white text-marca-azul" : "text-neutro-text2"}`}>{a.nome} ({n})</Link>;
        })}
      </div>
      {lista.length === 0 ? (
        <EmptyState icone="✉" titulo="Nada nesta aba" descricao="Não há solicitações neste estado no momento." />
      ) : (
        <div className="card overflow-x-auto anim-in">
          <table className="w-full text-[13px] min-w-[980px]">
            <thead><tr className="bg-neutro-surface2 text-left text-[11px] uppercase text-neutro-text2">
              <th className="p-3">Protocolo</th><th className="p-3">Título</th><th className="p-3">Secretaria</th><th className="p-3">Setor</th>
              <th className="p-3">Solicitante</th><th className="p-3">Chegada</th><th className="p-3">Prazo</th><th className="p-3">Status</th>
              <th className="p-3">{abaAtual.chave === "pendentes" ? "Aguardando" : "Decisão"}</th><th className="p-3">Ações</th></tr></thead>
            <tbody>{lista.map((s: any) => (
              <tr key={s.id} className="border-t border-neutro-border align-top transition-colors hover:bg-neutro-surface2/60">
                <td className="p-3"><span className="text-[11px] bg-neutro-surface2 border border-neutro-border rounded px-2 py-0.5">{s.protocolo}</span></td>
                <td className="p-3 font-semibold"><Link href={`/app/solicitacoes/${s.id}`} className="hover:text-marca-azul">{s.titulo}</Link>{s.restrita && <span className="ml-1 text-[11px] text-[#B23E17]">restrita</span>}</td>
                <td className="p-3">{s.secretaria}</td><td className="p-3">{s.setor}</td><td className="p-3">{s.solicitante}</td>
                <td className="p-3">{dtBR(s.created_at)}</td>
                <td className="p-3">{s.prazo_desejado ? dtBR(s.prazo_desejado) : "—"}</td>
                <td className="p-3">{rotuloStatus[s.status_externo] ?? s.status_externo}</td>
                <td className="p-3">
                  {abaAtual.chave === "pendentes"
                    ? <span className="text-[12px] text-[#B23E17] font-semibold">{tempoAguardando(s.created_at)}</span>
                    : s.decisao ? <span className="text-[12px] text-neutro-text2">{s.decisao.acao.replace("triagem_", "").replace("aprovada_convertida", "aprovada")}{s.decisao.justificativa ? ` — ${s.decisao.justificativa}` : ""}<br />{dtBR(s.decisao.created_at)}</span> : "—"}
                </td>
                <td className="p-3">
                  {["enviada", "em_analise", "aguardando_informacoes"].includes(s.status_externo)
                    ? <Link href={`/app/solicitacoes/${s.id}?analisar=1`}
                        className="inline-flex items-center h-8 px-3 rounded-md bg-marca-azul text-white text-[13px] font-semibold pressable">Analisar</Link>
                    : s.demandaId ? <Link href={`/app/demandas/${s.demandaId}`} className="text-[13px] font-semibold">Abrir demanda →</Link> : <span className="text-neutro-text3 text-[12px]">Registro</span>}
                </td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
