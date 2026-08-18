import { STATUS } from "@/lib/statuses";
// Etiqueta de status: nome + tom + ponto (nunca apenas cor).
export function StatusChip({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, tone: "neutro" };
  return (
    <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-semibold tone-${s.tone}`} role="status">
      <span aria-hidden className="w-2 h-2 rounded-full bg-current opacity-90" />
      {s.label}
    </span>
  );
}
export function AtrasoChip({ dias }: { dias: number }) {
  if (dias <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-semibold tone-vermelho" role="status"
      aria-label={`Em atraso há ${dias} dias`}>
      <span aria-hidden className="w-2 h-2 rounded-full bg-current" />Em atraso {dias}d
    </span>
  );
}
