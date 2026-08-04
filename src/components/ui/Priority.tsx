const CFG: Record<string, { label: string; cor: string; fundo: string; texto: string }> = {
  emergencial: { label: "Emergencial", cor: "#FF3B2B", fundo: "#FFE7E5", texto: "#B32219" },
  alta: { label: "Alta", cor: "#FF6729", fundo: "#FFE9E1", texto: "#B23E17" },
  media: { label: "Média", cor: "#FFC605", fundo: "#FFF6DA", texto: "#8A6A00" },
  baixa: { label: "Baixa", cor: "#98A1B0", fundo: "#EEF1F5", texto: "#5B6472" },
};
export function PriorityChip({ prioridade }: { prioridade: string }) {
  const c = CFG[prioridade] ?? CFG.media;
  return <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-semibold" style={{ background: c.fundo, color: c.texto }}>
    <span className="w-2 h-2 rotate-45" style={{ background: c.cor }} />{c.label}</span>;
}
export function PriorityDot({ prioridade }: { prioridade: string }) {
  const c = CFG[prioridade] ?? CFG.media;
  return <span title={`Prioridade: ${c.label}`} aria-label={`Prioridade ${c.label}`} className="inline-flex items-center gap-1">
    <span className="w-2.5 h-2.5 rotate-45 flex-none" style={{ background: c.cor }} /></span>;
}
