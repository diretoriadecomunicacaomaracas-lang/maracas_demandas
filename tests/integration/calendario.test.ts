import { seedStore } from "../../src/domain/seed.ts";
import { criarEvento, eventosNoIntervalo, alertasDevidos } from "../../src/domain/services/calendario.ts";
let p = 0, f = 0; const A = (c: boolean, m: string) => c ? (p++, console.log("  ✓", m)) : (f++, console.log("  ✗", m));
const { db, atores } = seedStore();
const dia = "2026-08-26T17:00:00.000Z"; // 14h em America/Sao_Paulo (UTC-3)
criarEvento(db, atores.coord, { subdemandaId: "x", titulo: "Card raiva animal", inicioUTC: dia, canal: "Instagram", status: "pub_aguard" });
A(eventosNoIntervalo(db, atores.coord, "2026-08-01T00:00:00Z", "2026-08-31T23:59:59Z").length === 1, "evento aparece no mês");
A(eventosNoIntervalo(db, atores.solSaude, "2026-08-01T00:00:00Z", "2026-08-31T23:59:59Z").length === 0, "solicitante não vê calendário interno");
const agora24 = new Date(new Date(dia).getTime() - 24 * 3600e3 + 60000).toISOString();
A(alertasDevidos({ id: "e", subdemandaId: null, titulo: "", inicioUTC: dia }, agora24).includes("24h"), "alerta 24h antes");
console.log(`Calendário: ${p} ok, ${f} falhas`); if (f) process.exit(1);
