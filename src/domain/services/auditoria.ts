import type { Store } from "../store.ts";
import { uid, agora } from "../store.ts";
export function registrar(db: Store, entidade: string, entidadeId: string | null, acao: string, autorId: string | null, extra?: { anterior?: unknown; novo?: unknown; justificativa?: string }) {
  db.auditoria.push({ id: uid("aud"), entidade, entidadeId, acao, autorId, valorAnterior: extra?.anterior, valorNovo: extra?.novo, justificativa: extra?.justificativa ?? null, createdAt: agora() });
}
