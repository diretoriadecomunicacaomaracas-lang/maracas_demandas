// Skeleton loading — respeita prefers-reduced-motion via .skeleton (globals.css).
export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`skeleton block ${className}`} style={style} aria-hidden />;
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} style={{ height: 12, width: i === lines - 1 ? "60%" : "100%" }} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card card-pad" aria-hidden>
      <Skeleton style={{ height: 12, width: "40%" }} />
      <Skeleton style={{ height: 28, width: "55%", marginTop: 10 }} />
    </div>
  );
}

// Bloco acessível de carregamento (com rótulo para leitores de tela).
export function LoadingBlock({ label = "Carregando…", children }: { label?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
