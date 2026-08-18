// Limites de "carga elevada" — indicador OPERACIONAL de distribuição, NÃO
// avaliação de desempenho. Centralizados para ajuste futuro sem tocar no painel.
export const LIMITES_CARGA = {
  ativasMin: 6,      // 6+ tarefas ativas sinaliza carga elevada
  atrasadasMin: 3,   // OU 3+ tarefas atrasadas
} as const;

export type CargaProfissional = { ativas: number; atrasadas: number; vencendo: number };

export function cargaElevada(c: { ativas: number; atrasadas: number }): { elevada: boolean; motivo: string | null } {
  if (c.ativas >= LIMITES_CARGA.ativasMin) return { elevada: true, motivo: `${c.ativas} tarefas ativas` };
  if (c.atrasadas >= LIMITES_CARGA.atrasadasMin) return { elevada: true, motivo: `${c.atrasadas} tarefas atrasadas` };
  return { elevada: false, motivo: null };
}
