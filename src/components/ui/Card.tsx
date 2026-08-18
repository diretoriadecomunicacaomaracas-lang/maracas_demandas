import { HTMLAttributes } from "react";

// Cartão base do design system. `hoverable` adiciona elevação suave no hover.
export function Card({ className = "", hoverable = false, ...p }: HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }) {
  return <div className={`card ${hoverable ? "hoverable" : ""} ${className}`} {...p} />;
}
export function CardHeader({ className = "", ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`card-hd ${className}`} {...p} />;
}
export function CardBody({ className = "", ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`card-pad ${className}`} {...p} />;
}

// Bloco de seção com título e ação opcional (usado no Painel e telas internas).
export function SectionCard({ titulo, icone, acao, children, className = "" }:
  { titulo: string; icone?: React.ReactNode; acao?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card anim-in ${className}`}>
      <div className="card-hd">
        {icone && <span aria-hidden className="text-neutro-text2">{icone}</span>}
        <h2 className="text-[15px] font-bold flex-1">{titulo}</h2>
        {acao}
      </div>
      <div className="card-pad">{children}</div>
    </section>
  );
}
