"use client";
// Tooltip leve e acessível (aparece no hover e no foco por teclado).
export function Tooltip({ label, children, className = "" }:
  { label: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={`relative inline-flex group ${className}`}>
      {children}
      <span role="tooltip"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[calc(100%+6px)] z-[60] whitespace-nowrap
          rounded-md bg-neutro-text text-white text-[11px] font-medium px-2 py-1 shadow-md
          opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
        {label}
      </span>
    </span>
  );
}
