"use client";
import { useEffect, useRef, useState } from "react";
import { getNotificacoesTopo, marcarTodasLidas } from "@/server/data/me";
import { marcarLida } from "@/server/data/notificacoes";

type N = { id: string; tipo: string; titulo: string; referencia_url: string | null; lida: boolean; created_at: string };

export function NotifBell() {
  const [itens, setItens] = useState<N[]>([]); const [naoLidas, setNaoLidas] = useState(0);
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  async function carregar() { const r = await getNotificacoesTopo(); setItens(r.itens as any); setNaoLidas(r.naoLidas); }
  useEffect(() => { carregar(); const t = setInterval(carregar, 30000); return () => clearInterval(t); }, []); // polling p/ "atualizações"
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc); return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  async function abrirItem(n: N) { await marcarLida(n.id); if (n.referencia_url) window.location.href = n.referencia_url; else carregar(); }
  async function todas() { await marcarTodasLidas(); carregar(); }
  const dt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen((o) => !o); if (!open) carregar(); }} aria-label={`Notificações${naoLidas ? `, ${naoLidas} não lidas` : ""}`}
        className="w-10 h-10 rounded-[10px] hover:bg-neutro-surface2 relative grid place-items-center">🔔
        {naoLidas > 0 && <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-marca-vermelho text-white text-[10px] font-bold grid place-items-center">{naoLidas}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[92vw] bg-white border border-neutro-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-neutro-border"><b>Notificações</b>{naoLidas > 0 && <button onClick={todas} className="text-[12px] text-marca-azul font-semibold">Marcar todas como lidas</button>}</div>
          <div className="max-h-[380px] overflow-auto">
            {itens.length === 0 && <div className="p-6 text-center text-neutro-text2 text-[13px]">Sem notificações.</div>}
            {itens.map((n) => (
              <button key={n.id} onClick={() => abrirItem(n)} className={`w-full text-left p-3 border-b border-neutro-border hover:bg-neutro-surface2 ${n.lida ? "" : "bg-[#E7F3FF]"}`}>
                <div className="text-[13px]">{n.titulo}</div><div className="text-[11px] text-neutro-text2">{dt(n.created_at)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
