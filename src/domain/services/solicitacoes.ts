import type { Store } from "../store.ts";
import type { Ator, Solicitacao, TipoDemanda } from "../types.ts";
import { uid, agora } from "../store.ts";
import { respeita24h, novoProtocolo } from "../rules.ts";
import { registrar } from "./auditoria.ts";
import { notificar, enfileirarEmail } from "./notificacoes.ts";

export function criarSolicitacao(db: Store, ator: Ator, dados: { titulo: string; tipo?: TipoDemanda; secretariaId: string; unidadeId?: string; prazoDesejado?: string; descricao?: string; restrita?: boolean }): { ok: true; solic: Solicitacao } | { ok: false; erro: string } {
  if (ator.ambiente !== "solicitante") return { ok: false, erro: "Apenas solicitantes criam solicitações externas." };
  if (ator.secretariaId !== dados.secretariaId) return { ok: false, erro: "Você só pode solicitar pela sua secretaria." };
  if (dados.prazoDesejado && !respeita24h(dados.prazoDesejado)) {
    return { ok: false, erro: "As solicitações devem ser enviadas com antecedência mínima de 24 horas." };
  }
  const solic: Solicitacao = { id: uid("sol"), protocolo: novoProtocolo(), titulo: dados.titulo, descricao: dados.descricao, tipo: dados.tipo,
    secretariaId: dados.secretariaId, unidadeId: dados.unidadeId ?? null, criadoPor: ator.id, prazoDesejado: dados.prazoDesejado ?? null,
    restrita: !!dados.restrita, statusExterno: "enviada", autorizados: [], createdAt: agora() };
  db.solicitacoes.push(solic);
  registrar(db, "solicitacao", solic.id, "criada", ator.id);
  return { ok: true, solic };
}

// Visibilidade por secretaria principal; restrita como exceção. Interno vê tudo (triagem).
export function listarSolicitacoes(db: Store, ator: Ator): Solicitacao[] {
  return db.solicitacoes.filter(s => {
    if (s.deletedAt) return false;
    if (ator.ambiente === "interno") return true;
    if (ator.ambiente !== "solicitante") return false;
    if (s.secretariaId !== ator.secretariaId) return false;
    if (s.restrita) return s.criadoPor === ator.id || s.autorizados.includes(ator.id);
    return true;
  });
}

export function marcarRestrita(db: Store, ator: Ator, solicId: string, restrita: boolean): { ok: boolean; erro?: string } {
  const s = db.solicitacoes.find(x => x.id === solicId); if (!s) return { ok: false, erro: "Solicitação não encontrada." };
  const ehCriador = ator.id === s.criadoPor;
  const ehDirCoord = ator.cargos.includes("diretor") || ator.cargos.includes("coordenador");
  if (restrita && !(ehCriador || ehDirCoord)) return { ok: false, erro: "Sem permissão para restringir." };
  if (!restrita && !ehDirCoord) return { ok: false, erro: "Retirar restrição é do Diretor/Coordenador." };
  s.restrita = restrita; registrar(db, "solicitacao", s.id, restrita ? "restringida" : "restricao_retirada", ator.id);
  return { ok: true };
}

// Triagem (interno): pedir info / ajustar prazo / recusar / cancelar / aprovar→demanda.
export function triagem(db: Store, ator: Ator, solicId: string, acao: "pedir_info" | "ajustar_prazo" | "recusar" | "cancelar" | "aprovar", extra?: { prazo?: string; mensagem?: string }): { ok: boolean; erro?: string; demandaId?: string } {
  if (!ator.cargos.some(c => ["diretor","coordenador","administrador"].includes(c))) return { ok: false, erro: "Triagem é da Coordenação/Direção." };
  const s = db.solicitacoes.find(x => x.id === solicId); if (!s) return { ok: false, erro: "Solicitação não encontrada." };
  const criadorEmail = "solicitante@exemplo"; // resolvido pela app; aqui só enfileira por tipo
  if (acao === "pedir_info") { s.statusExterno = "aguardando_informacoes"; enfileirarEmail(db, criadorEmail, "pedido_informacoes", "Precisamos de mais informações"); }
  else if (acao === "ajustar_prazo") { s.prazoDesejado = extra?.prazo ?? s.prazoDesejado; }
  else if (acao === "recusar") { s.statusExterno = "recusada"; enfileirarEmail(db, criadorEmail, "solicitacao_recusada", "Solicitação recusada"); }
  else if (acao === "cancelar") { s.statusExterno = "cancelada"; enfileirarEmail(db, criadorEmail, "solicitacao_cancelada", "Solicitação cancelada"); }
  else if (acao === "aprovar") {
    s.statusExterno = "aprovada_planejamento";
    const dem = { id: uid("dem"), titulo: s.titulo, campanha: false, solicitacaoId: s.id, prioridade: "media" as const, situacao: "ativa" as const, createdAt: agora() };
    db.demandas.push(dem);
    const sub = { id: uid("sub"), demandaId: dem.id, titulo: s.titulo, tipo: (s.tipo ?? "digital"), membros: [], prioridade: "media" as const,
      etapa: "planejamento", macroetapa: "planejamento", prazo: s.prazoDesejado ?? null, secretariaId: s.secretariaId, situacao: "ativa" as const, createdAt: agora() };
    db.subdemandas.push(sub);
    enfileirarEmail(db, criadorEmail, "solicitacao_aprovada", "Solicitação aprovada — em planejamento");
    registrar(db, "solicitacao", s.id, "aprovada_convertida", ator.id, { novo: { demandaId: dem.id } });
    return { ok: true, demandaId: dem.id };
  }
  registrar(db, "solicitacao", s.id, `triagem_${acao}`, ator.id);
  return { ok: true };
}
