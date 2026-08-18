// Estado vazio padronizado — mesma linguagem visual em todas as telas.
export function EmptyState({ icone = "✦", titulo, descricao, acao, className = "" }:
  { icone?: React.ReactNode; titulo: string; descricao?: string; acao?: React.ReactNode; className?: string }) {
  return (
    <div className={`card anim-in text-center ${className}`} style={{ padding: "40px 24px" }}>
      <div className="text-[26px] mb-2 text-neutro-text3" aria-hidden>{icone}</div>
      <div className="font-semibold text-neutro-text">{titulo}</div>
      {descricao && <p className="text-neutro-text2 text-[13px] mt-1 max-w-[440px] mx-auto">{descricao}</p>}
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </div>
  );
}
