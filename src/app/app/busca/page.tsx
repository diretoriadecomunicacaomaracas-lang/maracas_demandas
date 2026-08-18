import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { buscaGlobal, type FiltrosBusca, type CategoriaBusca } from "@/server/data/busca";
import { listarInternos } from "@/server/data/usuarios";
import { createSupabaseServer } from "@/lib/supabase-server";
import { BuscaFiltros } from "@/components/interno/busca/BuscaFiltros";
import { Realce } from "@/components/interno/busca/Realce";
import { EmptyState } from "@/components/ui/EmptyState";
import { PriorityChip } from "@/components/ui/Priority";
import { STATUS } from "@/lib/statuses";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const GRUPOS: { cat: CategoriaBusca; nome: string; icone: string }[] = [
  { cat: "demanda", nome: "Demandas", icone: "▤" },
  { cat: "solicitacao", nome: "Solicitações", icone: "✉" },
  { cat: "conteudo", nome: "Conteúdos", icone: "✎" },
  { cat: "comentario", nome: "Comentários", icone: "💬" },
  { cat: "link", nome: "Links", icone: "🔗" },
];
const CAT_LABEL: Record<CategoriaBusca, string> = {
  demanda: "Demanda", solicitacao: "Solicitação", conteudo: "Conteúdo", comentario: "Comentário", link: "Link",
};
const dtBR = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—");

export default async function BuscaPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  const q = (searchParams.q ?? "").trim();
  const filtros: FiltrosBusca = {
    secretariaId: searchParams.secretaria || undefined, tipo: searchParams.tipo || undefined,
    status: searchParams.status || undefined, prioridade: searchParams.prioridade || undefined,
    profissionalId: searchParams.prof || undefined, de: searchParams.de || undefined, ate: searchParams.ate || undefined,
  };

  const sb = createSupabaseServer();
  const [{ data: secs }, internos] = await Promise.all([
    sb.from("secretarias").select("id,nome").is("deleted_at", null).order("nome"),
    listarInternos(),
  ]);
  const secOpts = (secs ?? []).map((s: any) => ({ value: s.id, label: s.nome }));
  const intOpts = (internos ?? []).map((u: any) => ({ value: u.id, label: u.nome }));
  const statusOpts = Object.entries(STATUS).map(([k, v]) => ({ value: k, label: (v as any).label }));

  const resultados = q.length >= 2 ? await buscaGlobal(q, filtros) : [];
  const porCat = (c: CategoriaBusca) => resultados.filter((r) => r.categoria === c);

  return (
    <AppShell atual="busca" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="mb-4">
        <h1 className="text-[22px] font-bold">Busca</h1>
        <p className="text-neutro-text2 text-[13px]">
          {q ? <>Resultados para <b>“{q}”</b> · {resultados.length} encontrado(s)</> : "Digite na barra do topo e pressione Enter."}
        </p>
      </div>

      {q.length >= 2 && <BuscaFiltros secretarias={secOpts} internos={intOpts} status={statusOpts} />}

      {q.length < 2 ? (
        <EmptyState icone="🔎" titulo="Pesquise em todo o histórico" descricao="Protocolos, títulos, briefings, roteiros, legendas, comentários, links, secretaria, solicitante ou responsável — com ou sem acento, palavra parcial ou várias palavras." />
      ) : resultados.length === 0 ? (
        <EmptyState icone="🔍" titulo="Nenhum resultado" descricao={`Nada encontrado para “${q}” com os filtros atuais. Tente outros termos ou limpe os filtros.`} />
      ) : (
        <div className="flex flex-col gap-5">
          {GRUPOS.map((g) => {
            const itens = porCat(g.cat);
            if (!itens.length) return null;
            return (
              <section key={g.cat} className="anim-in">
                <div className="flex items-center gap-2 mb-2">
                  <span aria-hidden>{g.icone}</span>
                  <h2 className="text-[15px] font-bold">{g.nome}</h2>
                  <span className="text-[12px] text-neutro-text3">({itens.length})</span>
                </div>
                <div className="flex flex-col gap-2 stagger">
                  {itens.map((r) => (
                    <Link key={`${r.categoria}-${r.id}`} href={r.url} className="card card-pad hoverable pressable block">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-neutro-text3">{CAT_LABEL[r.categoria]}</span>
                        {r.protocolo && <span className="text-[11px] bg-neutro-surface2 border border-neutro-border rounded px-2 py-0.5">{r.protocolo}</span>}
                        {r.prioridade && <PriorityChip prioridade={r.prioridade} />}
                      </div>
                      <div className="font-semibold text-neutro-text">{r.titulo || "(sem título)"}</div>
                      {r.corpo && <div className="text-[13px] text-neutro-text2 mt-1"><Realce texto={r.corpo} termo={q} /></div>}
                      <div className="flex items-center gap-3 flex-wrap text-[12px] text-neutro-text3 mt-2">
                        {r.secretariaNome && <span>🏛 {r.secretariaNome}</span>}
                        {r.status && <span>• {(STATUS[r.status] as any)?.label ?? r.status}</span>}
                        <span>• {dtBR(r.data)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
