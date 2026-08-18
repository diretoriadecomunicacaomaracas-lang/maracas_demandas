"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const CHAVE = "buscas_recentes";
function lerRecentes(): string[] { try { return JSON.parse(localStorage.getItem(CHAVE) || "[]"); } catch { return []; } }
function salvarRecente(q: string) {
  const atual = lerRecentes().filter((x) => x.toLowerCase() !== q.toLowerCase());
  localStorage.setItem(CHAVE, JSON.stringify([q, ...atual].slice(0, 6)));
}

// Busca global do topo: Enter abre /app/busca?q=..., atalho "/", limpar e recentes.
export function BuscaHeader() {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [aberto, setAberto] = useState(false);
  const [recentes, setRecentes] = useState<string[]>([]);
  const ref = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (pathname === "/app/busca") setQ(sp.get("q") ?? ""); }, [pathname, sp]);
  useEffect(() => { setRecentes(lerRecentes()); }, [aberto]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toUpperCase();
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") { e.preventDefault(); ref.current?.focus(); }
    };
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setAberto(false); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDoc); };
  }, []);

  function irPara(termo: string) {
    const t = termo.trim(); if (t.length < 2) return;
    salvarRecente(t); setAberto(false);
    router.push(`/app/busca?q=${encodeURIComponent(t)}`);
  }

  return (
    <div ref={wrapRef} className="relative flex-1 max-w-[520px]">
      <form role="search" onSubmit={(e) => { e.preventDefault(); irPara(q); }}
        className="h-10 bg-neutro-surface2 border border-neutro-border rounded-[10px] flex items-center gap-2 px-3 text-neutro-text3
          transition focus-within:border-marca-azul focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(2,142,255,.12)]">
        <span aria-hidden>🔎</span>
        <label className="sr-only" htmlFor="busca">Pesquisar no sistema</label>
        <input id="busca" ref={ref} value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setAberto(true)}
          className="flex-1 bg-transparent outline-none text-neutro-text" placeholder="Pesquise o que quiser…" autoComplete="off" />
        {q ? (
          <button type="button" aria-label="Limpar busca" onClick={() => { setQ(""); ref.current?.focus(); }}
            className="text-neutro-text3 hover:text-neutro-text pressable">✕</button>
        ) : (
          <kbd className="hidden sm:grid place-items-center h-5 min-w-5 px-1 rounded border border-neutro-border bg-white text-[11px] text-neutro-text3">/</kbd>
        )}
      </form>

      {aberto && recentes.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-neutro-border rounded-xl shadow-lg z-50 overflow-hidden anim-fade">
          <div className="px-3 py-2 text-[11px] font-bold uppercase text-neutro-text3">Pesquisas recentes</div>
          {recentes.map((r) => (
            <button key={r} type="button" onMouseDown={(e) => { e.preventDefault(); irPara(r); }}
              className="w-full text-left px-3 py-2 text-[13px] text-neutro-text2 hover:bg-neutro-surface2 pressable flex items-center gap-2">
              <span aria-hidden className="text-neutro-text3">🕘</span>{r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
