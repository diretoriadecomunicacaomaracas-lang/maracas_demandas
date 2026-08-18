"use client";
// Abas acessíveis com sublinhado animado (respeita reduced-motion via CSS de transição).
export type TabDef = { key: string; label: string; badge?: number };

export function Tabs({ tabs, value, onChange, className = "" }:
  { tabs: TabDef[]; value: string; onChange: (k: string) => void; className?: string }) {
  function onKey(e: React.KeyboardEvent, i: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = e.key === "ArrowRight" ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
    onChange(tabs[next].key);
  }
  return (
    <div role="tablist" aria-label="Abas" className={`flex gap-1 border-b border-neutro-border overflow-x-auto ${className}`}>
      {tabs.map((t, i) => {
        const on = t.key === value;
        return (
          <button key={t.key} role="tab" aria-selected={on} tabIndex={on ? 0 : -1} onKeyDown={(e) => onKey(e, i)}
            onClick={() => onChange(t.key)}
            className={`relative px-3.5 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors
              ${on ? "text-marca-azul" : "text-neutro-text2 hover:text-neutro-text"}`}>
            {t.label}
            {typeof t.badge === "number" && <span className="ml-1 text-[11px] text-neutro-text3">({t.badge})</span>}
            <span aria-hidden style={{ transition: "background-color .18s ease" }}
              className={`absolute left-2 right-2 -bottom-px h-[2px] rounded ${on ? "bg-marca-azul" : "bg-transparent"}`} />
          </button>
        );
      })}
    </div>
  );
}
