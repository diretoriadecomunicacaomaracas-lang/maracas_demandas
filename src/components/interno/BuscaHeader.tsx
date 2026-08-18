"use client";
import { useEffect, useRef, useState } from "react";

// Barra de busca do topo.
// Etapa A: visual e interativa (foco, atalho "/", limpar). O roteamento para
// /app/busca?q=... é ativado na Etapa C (busca global).
export function BuscaHeader() {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault(); ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form role="search" onSubmit={(e) => e.preventDefault()}
      className="flex-1 max-w-[520px] h-10 bg-neutro-surface2 border border-neutro-border rounded-[10px]
        flex items-center gap-2 px-3 text-neutro-text3 transition
        focus-within:border-marca-azul focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(2,142,255,.12)]">
      <span aria-hidden>🔎</span>
      <label className="sr-only" htmlFor="busca">Pesquisar no sistema</label>
      <input id="busca" ref={ref} value={q} onChange={(e) => setQ(e.target.value)}
        className="flex-1 bg-transparent outline-none text-neutro-text" placeholder="Pesquise o que quiser…" />
      {q ? (
        <button type="button" aria-label="Limpar busca" onClick={() => { setQ(""); ref.current?.focus(); }}
          className="text-neutro-text3 hover:text-neutro-text pressable">✕</button>
      ) : (
        <kbd className="hidden sm:grid place-items-center h-5 min-w-5 px-1 rounded border border-neutro-border bg-white text-[11px] text-neutro-text3">/</kbd>
      )}
    </form>
  );
}
