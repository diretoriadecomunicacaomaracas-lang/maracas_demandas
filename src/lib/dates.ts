import { formatInTimeZone } from "date-fns-tz";
export const TZ = process.env.APP_TIMEZONE || "America/Sao_Paulo";
// Exibição sempre em Brasília, DD/MM/AAAA e 24h. Armazenamento em UTC (timestamptz).
export const dataBR = (d: Date | string) => formatInTimeZone(new Date(d), TZ, "dd/MM/yyyy");
export const dataHoraBR = (d: Date | string) => formatInTimeZone(new Date(d), TZ, "dd/MM/yyyy HH:mm");
export const horaBR = (d: Date | string) => formatInTimeZone(new Date(d), TZ, "HH:mm");
// Regra de 24h para solicitações externas.
export function respeita24h(prazo: Date, agora = new Date()): boolean {
  return prazo.getTime() - agora.getTime() >= 24 * 3600 * 1000;
}
