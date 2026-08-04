// Regras puras (sem dependências externas) para rodar em qualquer ambiente.
export function respeita24h(prazoISO: string, agoraISO = new Date().toISOString()): boolean {
  return new Date(prazoISO).getTime() - new Date(agoraISO).getTime() >= 24 * 3600 * 1000;
}
export function atrasoDias(prazoISO: string | null | undefined, macroetapa: string): number {
  if (!prazoISO) return 0;
  if (["concluido","finalizado","cancelado"].includes(macroetapa)) return 0;
  const d = Date.now() - new Date(prazoISO).getTime();
  return d > 0 ? Math.floor(d / 86400000) : 0;
}
let pseq = 8500;
export const novoProtocolo = () => `2026-${(++pseq).toString().padStart(4, "0")}`;
