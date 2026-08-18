import type { Store } from "../store.ts";
import type { Ator, Subdemanda } from "../types.ts";
import { uid, agora } from "../store.ts";
import { can } from "../../lib/permissions.ts";
import { transicaoValida, ETAPAS_CRITICAS, MACRO } from "../flows.ts";
import { registrar } from "./auditoria.ts";
import { notificar } from "./notificacoes.ts";

export function criarSubdemanda(db: Store, ator: Ator, demandaId: string, dados: { titulo: string; tipo: Subdemanda["tipo"]; responsavelId?: string; membros?: string[] }): { ok: boolean; erro?: string; sub?: Subdemanda } {
  if (!can(ator.cargos, "criar_demanda")) return { ok: false, erro: "Sem permissão para criar demanda." };
  const sub: Subdemanda = { id: uid("sub"), demandaId, titulo: dados.titulo, tipo: dados.tipo, responsavelId: dados.responsavelId ?? null,
    membros: dados.membros ?? [], prioridade: "media", etapa: "planejamento", macroetapa: "planejamento", situacao: "ativa", createdAt: agora() };
  db.subdemandas.push(sub); registrar(db, "subdemanda", sub.id, "criada", ator.id);
  return { ok: true, sub };
}

// Editar campos administrativos só Diretor/Coordenador; operacionais os membros.
export function editarCampoAdministrativo(db: Store, ator: Ator, subId: string, campo: "prioridade" | "prazo" | "responsavelId", valor: any): { ok: boolean; erro?: string } {
  if (!can(ator.cargos, "editar_admin_demanda")) return { ok: false, erro: "Campos administrativos são do Diretor/Coordenador." };
  const s = db.subdemandas.find(x => x.id === subId); if (!s) return { ok: false, erro: "Subdemanda não encontrada." };
  (s as any)[campo] = valor; registrar(db, "subdemanda", s.id, `admin:${campo}`, ator.id, { novo: valor });
  return { ok: true };
}

// Kanban: mover etapa com validação no servidor (permissão + transição + etapa crítica).
export function moverEtapa(db: Store, ator: Ator, subId: string, novaEtapa: string): { ok: boolean; erro?: string } {
  const s = db.subdemandas.find(x => x.id === subId); if (!s) return { ok: false, erro: "Subdemanda não encontrada." };
  const ehMembro = s.membros.includes(ator.id) || s.responsavelId === ator.id;
  if (!can(ator.cargos, "movimentar_producao") || !(ehMembro || can(ator.cargos, "editar_admin_demanda")))
    return { ok: false, erro: "Você não participa desta subdemanda." };
  if (!transicaoValida(s.tipo, s.etapa, novaEtapa)) return { ok: false, erro: "Transição inválida para este fluxo." };
  if (ETAPAS_CRITICAS.has(novaEtapa)) return { ok: false, erro: "Esta etapa depende de aprovação/liberação — use a ação específica." };
  const de = s.etapa; s.etapa = novaEtapa; s.macroetapa = MACRO[novaEtapa] ?? s.macroetapa;
  registrar(db, "subdemanda", s.id, "mover_etapa", ator.id, { anterior: de, novo: novaEtapa });
  if (s.responsavelId) notificar(db, s.responsavelId, "mudanca_etapa", `Etapa atualizada: ${novaEtapa}`);
  return { ok: true };
}

export function arquivar(db: Store, ator: Ator, subId: string): { ok: boolean; erro?: string } {
  if (!ator.cargos.some(c => ["administrador","diretor","coordenador"].includes(c))) return { ok: false, erro: "Sem permissão." };
  const s = db.subdemandas.find(x => x.id === subId); if (!s) return { ok: false, erro: "Não encontrada." };
  s.situacao = "arquivada"; registrar(db, "subdemanda", s.id, "arquivada", ator.id); return { ok: true };
}
export function excluirLogico(db: Store, ator: Ator, subId: string, justificativa: string): { ok: boolean; erro?: string } {
  if (!can(ator.cargos, "excluir_logico")) return { ok: false, erro: "Exclusão lógica é de Admin/Diretor/Coordenador." };
  if (!justificativa?.trim()) return { ok: false, erro: "Justificativa obrigatória." };
  const s = db.subdemandas.find(x => x.id === subId); if (!s) return { ok: false, erro: "Não encontrada." };
  s.situacao = "excluida_logicamente"; registrar(db, "subdemanda", s.id, "excluida_logicamente", ator.id, { justificativa });
  return { ok: true };
}

// Reabertura: só Diretor/Coordenador; preserva histórico; validade das aprovações conforme etapa de retorno.
export function reabrir(db: Store, ator: Ator, subId: string, etapaRetorno: string, justificativa: string): { ok: boolean; erro?: string } {
  if (!can(ator.cargos, "reabrir_demanda")) return { ok: false, erro: "Reabertura é exclusiva de Diretor/Coordenador." };
  if (!justificativa?.trim()) return { ok: false, erro: "Justificativa obrigatória." };
  const s = db.subdemandas.find(x => x.id === subId); if (!s) return { ok: false, erro: "Não encontrada." };
  const anteriorAprovacao = ["planejamento","criacao","roteiro","gravacao","edicao","revisao"].includes(etapaRetorno);
  if (anteriorAprovacao) {
    // aprovações permanecem no histórico, mas perdem validade operacional
    for (const v of db.versoes.filter(v => v.subdemandaId === subId))
      for (const a of db.aprovacoes.filter(a => a.versaoId === v.id && a.ativa)) a.ativa = false;
  }
  s.situacao = "ativa"; s.etapa = etapaRetorno; s.macroetapa = MACRO[etapaRetorno] ?? "planejamento";
  registrar(db, "subdemanda", s.id, "reaberta", ator.id, { novo: etapaRetorno, justificativa });
  return { ok: true };
}
