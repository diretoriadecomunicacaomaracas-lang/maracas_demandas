import type { Store } from "../store.ts";
import type { Ator, EventoCalendario } from "../types.ts";
import { uid } from "../store.ts";

// Calendário editorial: armazena início em UTC; a UI exibe em America/Sao_Paulo (src/lib/dates.ts).
export function criarEvento(db: Store, ator: Ator, dados: { subdemandaId?: string; titulo: string; inicioUTC: string; duracaoMin?: number; canal?: string; status?: string }): { ok: boolean; erro?: string; id?: string } {
  if (ator.ambiente !== "interno") return { ok: false, erro: "Calendário é interno." };
  const ev: EventoCalendario = { id: uid("evt"), subdemandaId: dados.subdemandaId ?? null, titulo: dados.titulo, inicioUTC: dados.inicioUTC, duracaoMin: dados.duracaoMin ?? null, canal: dados.canal ?? null, status: dados.status ?? null };
  db.eventos.push(ev); return { ok: true, id: ev.id };
}
export function eventosNoIntervalo(db: Store, ator: Ator, deISO: string, ateISO: string): EventoCalendario[] {
  if (ator.ambiente !== "interno") return [];
  const de = new Date(deISO).getTime(), ate = new Date(ateISO).getTime();
  return db.eventos.filter(e => { const t = new Date(e.inicioUTC).getTime(); return t >= de && t <= ate; })
    .sort((a, b) => new Date(a.inicioUTC).getTime() - new Date(b.inicioUTC).getTime());
}
// Alertas de publicação: 24h antes, 1h antes e no horário.
export function alertasDevidos(evento: EventoCalendario, agoraISO = new Date().toISOString()): ("24h" | "1h" | "no_horario")[] {
  const t = new Date(evento.inicioUTC).getTime(); const now = new Date(agoraISO).getTime();
  const mins = (t - now) / 60000; const out: ("24h" | "1h" | "no_horario")[] = [];
  if (mins <= 24 * 60 && mins > 24 * 60 - 5) out.push("24h");
  if (mins <= 60 && mins > 55) out.push("1h");
  if (mins <= 0 && mins > -5) out.push("no_horario");
  return out;
}
