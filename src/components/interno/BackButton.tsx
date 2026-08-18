"use client";
import { useRouter } from "next/navigation";

export function BackButton({ fallback = "/app/painel", label }: { fallback?: string; label?: string }) {
  const router = useRouter();
  function voltar() {
    // Só usa o histórico se a origem for do próprio site e não for /login.
    if (typeof window !== "undefined") {
      const ref = document.referrer;
      const mesmaOrigem = ref && ref.startsWith(window.location.origin) && !ref.includes("/login");
      if (window.history.length > 1 && mesmaOrigem) { router.back(); return; }
    }
    router.push(fallback);
  }
  return (
    <button onClick={voltar} aria-label="Voltar" title="Voltar"
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] border border-neutro-border bg-white hover:bg-neutro-surface2 text-[13px] font-semibold text-neutro-text2">
      <span aria-hidden>←</span> {label ?? "Voltar"}
    </button>
  );
}

export function Breadcrumb({ trilha }: { trilha: { nome: string; href?: string }[] }) {
  return (
    <nav aria-label="Trilha" className="text-[12px] text-neutro-text2 flex items-center gap-1.5 flex-wrap">
      {trilha.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {t.href ? <a href={t.href} className="hover:text-marca-azul">{t.nome}</a> : <span className="text-neutro-text">{t.nome}</span>}
          {i < trilha.length - 1 && <span aria-hidden>›</span>}
        </span>
      ))}
    </nav>
  );
}
