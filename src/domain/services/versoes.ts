import type { Store } from "../store.ts";
import type { Ator } from "../types.ts";
import { uid, agora } from "../store.ts";
import { can } from "../../lib/permissions.ts";
import { normalizarLinkDrive } from "../../lib/drive.ts";
import { registrar } from "./auditoria.ts";

// Adiciona versão: dedupe por ID de arquivo do Drive (mensagem amigável) + invalidação de aprovações anteriores.
export function adicionarVersao(db: Store, ator: Ator, subId: string, linkBruto: string, titulo?: string): { ok: boolean; erro?: string; versaoId?: string; numero?: number } {
  if (!can(ator.cargos, "editar_operacional")) return { ok: false, erro: "Sem permissão para cadastrar versão." };
  const norm = normalizarLinkDrive(linkBruto);
  if (!norm.ok) return { ok: false, erro: norm.motivo };
  const ativas = db.versoes.filter(v => v.subdemandaId === subId && v.estado !== "substituida" && v.estado !== "cancelada");
  const dup = ativas.find(v => v.driveFileId === norm.fileId);
  if (dup) return { ok: false, erro: `Este arquivo do Drive já está na versão V${dup.numero}. Cada versão deve ter um arquivo próprio.` };
  // invalida aprovações/liberações/confirmações e marca versões vigentes como substituídas
  for (const v of db.versoes.filter(v => v.subdemandaId === subId)) {
    if (v.vigente) { v.vigente = false; v.estado = "substituida"; }
    for (const a of db.aprovacoes.filter(a => a.versaoId === v.id && a.ativa)) a.ativa = false;
    for (const l of db.liberacoes.filter(l => l.versaoId === v.id && l.ativa)) l.ativa = false;
  }
  for (const c of db.confirmacoes) { const pv = db.versoes.find(v => v.id === c.versaoId); if (pv && pv.subdemandaId === subId && c.ativa) c.ativa = false; }
  const numero = (ativas.reduce((m, v) => Math.max(m, v.numero), 0) || db.versoes.filter(v => v.subdemandaId === subId).reduce((m, v) => Math.max(m, v.numero), 0)) + 1;
  const versao = { id: uid("ver"), subdemandaId: subId, numero, titulo: titulo ?? null, linkDrive: norm.canonical, driveFileId: norm.fileId, autorId: ator.id, estado: "em_revisao" as const, vigente: true, createdAt: agora() };
  db.versoes.push(versao);
  registrar(db, "versao", versao.id, "criada", ator.id, { novo: { numero, fileId: norm.fileId } });
  return { ok: true, versaoId: versao.id, numero };
}
