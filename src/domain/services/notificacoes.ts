import type { Store } from "../store.ts";
import { uid, agora } from "../store.ts";
// Notificação interna (central/sino).
export function notificar(db: Store, destinatarioId: string, tipo: string, titulo: string, refUrl?: string) {
  db.notificacoes.push({ id: uid("ntf"), destinatarioId, canal: "interno", tipo, titulo, refUrl: refUrl ?? null, lida: false, createdAt: agora() });
}
// E-mail (apenas eventos importantes). Aqui apenas ENFILEIRA (envio real via src/server/email.ts quando houver credencial).
const EVENTOS_EMAIL = new Set([
  "convite","recuperacao_senha","pedido_informacoes","solicitacao_aprovada","solicitacao_recusada","solicitacao_cancelada",
  "aprovacao_pendente","correcao_formal","demanda_atrasada","versao_liberada_impressao","versao_substituida",
  "problema_grafica","divergencia","reimpressao","entrega","reabertura",
]);
export function enfileirarEmail(db: Store, para: string, tipo: string, assunto: string): boolean {
  if (!EVENTOS_EMAIL.has(tipo)) return false; // e-mail só para eventos importantes (v2.2)
  db.emails.push({ id: uid("eml"), para, assunto, tipo, situacao: "pendente", createdAt: agora() });
  return true;
}
export function marcarLidaNotif(db: Store, id: string) { const n = db.notificacoes.find(x => x.id === id); if (n) n.lida = true; }
