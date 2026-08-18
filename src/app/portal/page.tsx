import { getAtor } from "@/server/context";
import { createSupabaseServer } from "@/lib/supabase-server";
import { PortalHeader } from "@/components/interno/PortalHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { dataBR } from "@/lib/dates";
import { redirect } from "next/navigation";
import Link from "next/link";

const ABAS = [
  { chave: "enviadas", nome: "Enviadas", status: ["enviada", "em_analise", "aguardando_informacoes"] },
  { chave: "execucao", nome: "Aprovadas (em execução)", status: ["aprovada_planejamento"] },
  { chave: "finalizadas", nome: "Finalizadas", status: ["concluida", "recusada", "cancelada"] },
];
const rotulo: Record<string, string> = { enviada: "Enviada", em_analise: "Em análise", aguardando_informacoes: "Aguardando informações", aprovada_planejamento: "Aprovada — em execução", concluida: "Concluída", recusada: "Recusada", cancelada: "Cancelada" };

export default async function PortalSolicitante({ searchParams }: { searchParams: { aba?: string } }) {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "solicitante") redirect("/");
  const abaAtual = ABAS.find((a) => a.chave === (searchParams.aba ?? "enviadas")) ?? ABAS[0];
  const sb = createSupabaseServer();
  const { data: todas } = await sb.from("solicitacoes").select("id,protocolo,titulo,status_externo,created_at,prazo_desejado").is("deleted_at", null).order("created_at", { ascending: false });
  const lista = (todas ?? []).filter((s: any) => abaAtual.status.includes(s.status_externo));
  const conta = (chaves: string[]) => (todas ?? []).filter((s: any) => chaves.includes(s.status_externo)).length;

  return (
    <div className="min-h-screen bg-neutro-bg">
      <PortalHeader titulo="Portal do Solicitante" />
      <main className="max-w-[960px] mx-auto p-5">
        <div className="flex items-start gap-4 mb-3 flex-wrap">
          <div><h1 className="text-[22px] font-bold">Minhas solicitações</h1><p className="text-neutro-text2 text-[13px]">Solicitações da sua secretaria</p></div>
          <div className="flex-1" />
          <Link href="/portal/nova" className="inline-flex items-center gap-2 h-10 px-4 rounded-md font-semibold text-sm bg-marca-azul text-white">＋ Nova solicitação</Link>
        </div>
        <div className="inline-flex bg-neutro-surface2 border border-neutro-border rounded-[10px] p-[3px] mb-4 flex-wrap">
          {ABAS.map((a) => <Link key={a.chave} href={`/portal?aba=${a.chave}`} className={`h-8 px-3 grid place-items-center rounded-lg font-semibold text-[13px] ${abaAtual.chave === a.chave ? "bg-white text-marca-azul" : "text-neutro-text2"}`}>{a.nome} ({conta(a.status)})</Link>)}
        </div>
        {abaAtual.chave === "enviadas" && <div className="tone-azul rounded-[10px] px-4 py-3 text-sm mb-4">As solicitações devem ter antecedência mínima de <b>24 horas</b>.</div>}
        {abaAtual.chave === "finalizadas" && <div className="tone-verde rounded-[10px] px-4 py-3 text-sm mb-4">Solicitações concluídas ou encerradas ficam arquivadas aqui.</div>}
        {lista.length === 0 ? (
          <div className="bg-white border border-neutro-border rounded-xl p-8 text-center text-neutro-text2">Nada nesta aba.</div>
        ) : lista.map((s: any) => (
          <Link key={s.id} href={`/portal/${s.id}`} className="block bg-white border border-neutro-border rounded-xl p-4 mb-3 shadow-sm hover:bg-neutro-surface2">
            <div className="flex items-center gap-4">
              <div className="flex-1"><div className="font-semibold">{s.titulo}</div><div className="text-[12px] text-neutro-text2">Protocolo {s.protocolo} · {dataBR(s.created_at)}</div></div>
              <StatusChip status={["concluida","aprovada_planejamento"].includes(s.status_externo) ? "aprovado" : "info"} />
              <span className="text-[12px] text-neutro-text2 hidden sm:block">{rotulo[s.status_externo] ?? s.status_externo}</span>
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}
