"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { PriorityChip } from "@/components/ui/Priority";
import { agendarItem } from "@/server/data/planejamento";
import { casa } from "@/domain/busca";
import type { ItemBacklog } from "@/server/data/planejamento";

export function Backlog({ itens, podeEditar }: { itens: ItemBacklog[]; podeEditar: boolean }) {
  const [q, setQ] = useState(""); const [tipo, setTipo] = useState("");
  const [agendando, setAgendando] = useState<string | null>(null);
  const filtrados = useMemo(() => itens.filter((i) =>
    (!tipo || i.tipo === tipo) &&
    (q.trim().length < 2 || casa([i.titulo, i.secretariaNome, i.setorNome, i.responsavelNome, i.protocolo].filter(Boolean).join(" "), q))
  ), [itens, q, tipo]);

  return (
    <div className="card anim-in">
      <div className="card-hd flex-col items-stretch gap-2">
        <h2 className="font-bold text-[15px]">Backlog de planejamento <span className="text-neutro-text3 font-normal">({itens.length})</span></h2>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar no backlog…" className="inp h-9 flex-1" />
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="inp h-9 w-[130px]"><option value="">Todos</option><option value="digital">Digital</option><option value="audiovisual">Audiovisual</option><option value="impresso">Impresso</option></select>
        </div>
      </div>
      <div className="card-pad flex flex-col gap-2 max-h-[70vh] overflow-auto">
        {filtrados.length === 0 && <p className="text-neutro-text3 text-[13px]">Nada não programado por aqui.</p>}
        {filtrados.map((i) => (
          <div key={i.id} className="border border-neutro-border rounded-[12px] p-3 hoverable">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {i.protocolo && <span className="text-[11px] bg-neutro-surface2 border border-neutro-border rounded px-2 py-0.5">{i.protocolo}</span>}
              <span className="text-[10px] font-bold uppercase text-neutro-text3">{i.tipo}</span>
              <PriorityChip prioridade={i.prioridade} />
            </div>
            <Link href={`/app/demandas/${i.id}`} className="font-semibold text-[14px] hover:text-marca-azul">{i.titulo}</Link>
            <div className="text-[12px] text-neutro-text3 mt-1 flex flex-wrap gap-x-3">
              {i.secretariaNome && <span>🏛 {i.secretariaNome}</span>}
              {i.setorNome && <span>· {i.setorNome}</span>}
              {i.responsavelNome ? <span>👤 {i.responsavelNome}</span> : <span>👤 sem responsável</span>}
              {i.prazo && <span>⏱ {new Date(i.prazo).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>}
            </div>
            {podeEditar && (agendando === i.id
              ? <FormAgendar subId={i.id} tipo={i.tipo} onDone={() => setAgendando(null)} />
              : <button onClick={() => setAgendando(i.id)} className="mt-2 text-[13px] font-semibold text-marca-azul pressable">📅 Agendar</button>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function FormAgendar({ subId, tipo, onDone }: { subId: string; tipo: string; onDone: () => void }) {
  const [dt, setDt] = useState(""); const [dur, setDur] = useState("60");
  const [pending, start] = useTransition(); const router = useRouter(); const toast = useToast();
  function agendar() {
    if (!dt) { toast.erro("Escolha data e horário."); return; }
    start(async () => {
      const r = await agendarItem(subId, new Date(dt).toISOString(), Number(dur) || 0, tipo);
      if (r.ok) { toast.sucesso("Agendado no calendário."); onDone(); router.refresh(); } else toast.erro(r.erro ?? "Erro.");
    });
  }
  return (
    <div className="mt-2 flex flex-wrap items-end gap-2 anim-expand">
      <label className="flex flex-col text-[11px] text-neutro-text3">Data/horário<input type="datetime-local" className="inp h-9" value={dt} onChange={(e) => setDt(e.target.value)} /></label>
      <label className="flex flex-col text-[11px] text-neutro-text3">Duração (min)<input type="number" className="inp h-9 w-[90px]" value={dur} onChange={(e) => setDur(e.target.value)} /></label>
      <Button variant="primary" disabled={pending} onClick={agendar}>Agendar</Button>
      <button onClick={onDone} className="text-[13px] text-neutro-text2 pressable">cancelar</button>
    </div>
  );
}
