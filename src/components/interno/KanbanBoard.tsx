"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FLUXOS, ETAPA_LABELS, destinosKanban, podeArrastar, mensagemDestinos } from "@/domain/flows";
import { moverEtapa } from "@/server/data/demandas";
import { StatusChip } from "@/components/ui/StatusChip";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { PriorityDot } from "@/components/ui/Priority";

type Pessoa = { nome: string; avatarUrl?: string | null };
type Sub = { id: string; titulo: string; tipo: "digital" | "audiovisual" | "impresso"; etapa: string; macroetapa: string; prazo: string | null; prioridade?: string; responsavel?: Pessoa | null; membros?: Pessoa[] };
const CORES: Record<string, string> = { planejamento: "var(--amarelo)", producao: "var(--laranja)", revisao_aprovacao: "var(--laranjaverm)", preparacao_saida: "var(--amarelo)", concluido: "var(--verde)", finalizado: "var(--verde)" };

export function KanbanBoard({ subs }: { subs: Sub[] }) {
  const [items, setItems] = useState<Sub[]>(subs);
  const [tipo, setTipo] = useState<"digital" | "audiovisual" | "impresso">("digital");
  const [drag, setDrag] = useState<Sub | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();
  const downRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);
  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3800); };

  // Colunas = etapas reais do fluxo do tipo selecionado (camada 2).
  const colunas = FLUXOS[tipo];
  const cards = useMemo(() => items.filter((s) => s.tipo === tipo), [items, tipo]);
  const destinos = drag ? destinosKanban(drag.tipo, drag.etapa) : [];

  async function soltar(etapaDestino: string) {
    const card = drag; setDrag(null); if (!card) return;
    if (card.etapa === etapaDestino) return;
    if (!destinosKanban(card.tipo, card.etapa).includes(etapaDestino)) { // destino inválido: nem move
      notify(mensagemDestinos(card.tipo, card.etapa)); return;
    }
    const anterior = card.etapa;
    setItems((prev) => prev.map((s) => s.id === card.id ? { ...s, etapa: etapaDestino } : s)); // otimista
    const r = await moverEtapa(card.id, etapaDestino);
    if (!r.ok) { setItems((prev) => prev.map((s) => s.id === card.id ? { ...s, etapa: anterior } : s)); notify(r.erro ?? "Movimento não permitido."); } // reverte só em falha real
    else notify("Movimentação registrada.");
  }

  return (
    <>
      <div className="inline-flex bg-neutro-surface2 border border-neutro-border rounded-[10px] p-[3px] mb-3">
        {(["digital", "audiovisual", "impresso"] as const).map((t) => (
          <button key={t} onClick={() => setTipo(t)}
            className={`h-8 px-3 rounded-lg font-semibold text-[13px] capitalize ${tipo === t ? "bg-white text-marca-azul" : "text-neutro-text2"}`}>{t}</button>
        ))}
      </div>
      <div className="tone-azul rounded-[10px] px-3 py-2 text-[13px] mb-3">
        Arraste um cartão para uma etapa <b>permitida</b> (destaque azul ao arrastar). Etapas de aprovação/liberação avançam pelos botões da demanda.
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 items-start">
        {colunas.map((etapa) => {
          const lista = cards.filter((s) => s.etapa === etapa);
          const ehDestinoValido = !!drag && destinos.includes(etapa);
          return (
            <div key={etapa}
              className={`w-[260px] flex-none rounded-xl p-2.5 min-h-[120px] border transition
                ${ehDestinoValido ? "border-marca-azul bg-[#E7F3FF]" : "border-neutro-border bg-neutro-surface2"}`}
              onDragOver={(e) => { if (ehDestinoValido) e.preventDefault(); }} onDrop={() => soltar(etapa)}
              role="list" aria-label={ETAPA_LABELS[etapa] ?? etapa}>
              <h4 className="text-[11px] uppercase text-neutro-text2 font-bold flex items-center gap-2 px-1.5 mb-2.5">
                <span className="w-2 h-2 rounded-sm" style={{ background: CORES[colMacro(etapa)] ?? "var(--azul)" }} />
                {ETAPA_LABELS[etapa] ?? etapa}
                <span className="ml-auto bg-white border border-neutro-border rounded-full px-2 text-[11px]">{lista.length}</span>
              </h4>
              {lista.map((s) => {
                const arrastavel = podeArrastar(s.tipo, s.etapa);
                return (
                  <div key={s.id} draggable={arrastavel}
                    onDragStart={() => { arrastavel && setDrag(s); movedRef.current = true; }} onDragEnd={() => setDrag(null)}
                    onPointerDown={(e) => { downRef.current = { x: e.clientX, y: e.clientY }; movedRef.current = false; }}
                    onClick={(e) => { const d = downRef.current; const dist = d ? Math.hypot(e.clientX - d.x, e.clientY - d.y) : 99; if (!movedRef.current && dist < 6) router.push(`/app/demandas/${s.id}`); }}
                    role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") router.push(`/app/demandas/${s.id}`); }}
                    title={arrastavel ? "Clique para abrir · arraste para mover" : "Clique para abrir"}
                    className={`bg-white border border-neutro-border rounded-[10px] shadow-sm p-2.5 mb-2.5 hover:border-marca-azul ${arrastavel ? "cursor-grab" : "cursor-pointer opacity-90"}`}>
                    <div className="font-semibold text-[13.5px] mb-2">{s.titulo}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] bg-neutro-surface2 border border-neutro-border rounded px-2 py-0.5 capitalize">{s.tipo}</span>
                      <StatusChip status={s.etapa} />
                      {s.prioridade && <PriorityDot prioridade={s.prioridade} />}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {(s.responsavel || (s.membros?.length ?? 0) > 0)
                        ? <AvatarStack pessoas={[...(s.responsavel ? [s.responsavel] : []), ...((s.membros as any) ?? [])]} max={4} />
                        : <span title="Sem responsável" aria-label="Sem responsável" className="inline-grid place-items-center w-[22px] h-[22px] rounded-full border border-dashed border-neutro-border text-neutro-text3 text-[11px]">?</span>}
                    </div>
                  </div>
                );
              })}
              {lista.length === 0 && <div className="text-[12px] text-neutro-text3 px-1.5">—</div>}
            </div>
          );
        })}
      </div>
      {toast && <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1F2430] text-white px-4 py-2.5 rounded-[10px] text-[13px] shadow-lg z-50 max-w-[90vw] text-center">{toast}</div>}
    </>
  );
}
function colMacro(etapa: string): string {
  const M: Record<string, string> = { planejamento: "planejamento", distribuicao: "planejamento", criacao: "producao", roteiro: "producao", gravacao_aguard: "producao", gravacao: "producao", edicao_aguard: "producao", edicao: "producao", revisao: "revisao_aprovacao", aprovacao: "revisao_aprovacao", aprov_coord: "revisao_aprovacao", aprov_dir: "revisao_aprovacao", correcao: "revisao_aprovacao", aprovado: "revisao_aprovacao", aprov_dois: "revisao_aprovacao", liberado_imp: "preparacao_saida", conf_grafica: "preparacao_saida", pedido_conf: "preparacao_saida", prod_grafica: "preparacao_saida", pronto: "preparacao_saida", transporte: "preparacao_saida", pub_aguard: "preparacao_saida", publicado: "concluido", entregue: "concluido", conferido: "concluido", finalizado: "finalizado" };
  return M[etapa] ?? "planejamento";
}
