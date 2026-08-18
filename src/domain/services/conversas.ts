import type { Store } from "../store.ts";
import type { Ator } from "../types.ts";
import { uid, agora } from "../store.ts";
import { notificar } from "./notificacoes.ts";

// Só internos membros do grupo participam. Sem conversas privadas (v2.2). Só links (sem upload).
export function enviarMensagem(db: Store, ator: Ator, grupoId: string, conteudo: string, mencoes: string[] = [], respondeA?: string): { ok: boolean; erro?: string; id?: string } {
  if (ator.ambiente !== "interno") return { ok: false, erro: "Chat é exclusivo da equipe interna." };
  const g = db.grupos.find(x => x.id === grupoId); if (!g) return { ok: false, erro: "Grupo não encontrado." };
  if (!g.membros.includes(ator.id)) return { ok: false, erro: "Você não é membro deste grupo." };
  const msg = { id: uid("msg"), grupoId, autorId: ator.id, conteudo, mencoes, respondeA: respondeA ?? null, editada: false, deletedAt: null, createdAt: agora() };
  db.mensagens.push(msg);
  for (const m of g.membros) if (m !== ator.id) { /* não lida por padrão */ }
  for (const u of mencoes) notificar(db, u, "mencao", `Você foi mencionado em ${g.nome}`);
  return { ok: true, id: msg.id };
}
export function naoLidas(db: Store, usuarioId: string, grupoId: string): number {
  const g = db.grupos.find(x => x.id === grupoId); if (!g) return 0;
  return db.mensagens.filter(m => m.grupoId === grupoId && !m.deletedAt && m.autorId !== usuarioId
    && !db.leituras.some(l => l.mensagemId === m.id && l.usuarioId === usuarioId)).length;
}
export function marcarLidas(db: Store, usuarioId: string, grupoId: string) {
  for (const m of db.mensagens.filter(m => m.grupoId === grupoId && m.autorId !== usuarioId))
    if (!db.leituras.some(l => l.mensagemId === m.id && l.usuarioId === usuarioId)) db.leituras.push({ mensagemId: m.id, usuarioId });
}
export function pesquisar(db: Store, ator: Ator, termo: string) {
  const meus = new Set(db.grupos.filter(g => g.membros.includes(ator.id)).map(g => g.id));
  const t = termo.toLowerCase();
  return db.mensagens.filter(m => meus.has(m.grupoId) && !m.deletedAt && m.conteudo.toLowerCase().includes(t));
}
export function editarMensagem(db: Store, ator: Ator, msgId: string, novo: string): { ok: boolean; erro?: string } {
  const m = db.mensagens.find(x => x.id === msgId); if (!m) return { ok: false, erro: "Mensagem não encontrada." };
  if (m.autorId !== ator.id) return { ok: false, erro: "Só o autor edita a própria mensagem." };
  m.conteudo = novo; m.editada = true; return { ok: true };
}
export function excluirLogicoMensagem(db: Store, ator: Ator, msgId: string): { ok: boolean; erro?: string } {
  const m = db.mensagens.find(x => x.id === msgId); if (!m) return { ok: false, erro: "Mensagem não encontrada." };
  const moderador = ator.cargos.some(c => ["administrador","diretor","coordenador"].includes(c));
  if (m.autorId !== ator.id && !moderador) return { ok: false, erro: "Sem permissão para excluir." };
  m.deletedAt = agora(); return { ok: true };
}
