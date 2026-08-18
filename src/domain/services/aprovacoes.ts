import type { Store } from "../store.ts";
import type { Ator, CargoChave } from "../types.ts";
import { uid, agora } from "../store.ts";
import { can } from "../../lib/permissions.ts";
import { validarLiberacaoImpressao, type EstadoLiberacao } from "../../lib/impressao.ts";
import { registrar } from "./auditoria.ts";
import { notificar, enfileirarEmail } from "./notificacoes.ts";

function cargoAprovador(ator: Ator): CargoChave | null {
  if (ator.cargos.includes("diretor")) return "diretor";
  if (ator.cargos.includes("coordenador")) return "coordenador";
  return null;
}

// Digital/audiovisual: "Aprovar" (valida) e "Liberar para publicação" são AÇÕES SEPARADAS.
export function aprovarDigital(db: Store, ator: Ator, versaoId: string, decisao: "aprovar" | "aprovar_com_observacao" | "solicitar_correcao" | "reprovar", observacao?: string): { ok: boolean; erro?: string } {
  if (!can(ator.cargos, "aprovar_digital")) return { ok: false, erro: "Aprovação é do Diretor ou Coordenador." };
  const cargo = cargoAprovador(ator)!; const v = db.versoes.find(x => x.id === versaoId); if (!v) return { ok: false, erro: "Versão não encontrada." };
  db.aprovacoes.push({ id: uid("apr"), versaoId, usuarioId: ator.id, cargo, decisao, observacao: observacao ?? null, ativa: true, createdAt: agora() });
  if (decisao === "aprovar" || decisao === "aprovar_com_observacao") v.estado = "aprovada";
  registrar(db, "versao", versaoId, `aprovacao:${decisao}`, ator.id);
  return { ok: true };
}
export function liberarPublicacao(db: Store, ator: Ator, versaoId: string): { ok: boolean; erro?: string } {
  if (!can(ator.cargos, "liberar_publicacao")) return { ok: false, erro: "Liberação é do Diretor ou Coordenador." };
  const v = db.versoes.find(x => x.id === versaoId); if (!v) return { ok: false, erro: "Versão não encontrada." };
  const aprovada = db.aprovacoes.some(a => a.versaoId === versaoId && a.ativa && (a.decisao === "aprovar" || a.decisao === "aprovar_com_observacao"));
  if (!aprovada) return { ok: false, erro: "A versão precisa estar aprovada antes de liberar para publicação." };
  db.liberacoes.push({ id: uid("lib"), versaoId, tipo: "publicacao", usuarioId: ator.id, cargo: cargoAprovador(ator)!, ativa: true, createdAt: agora() });
  v.estado = "liberada_publicacao";
  registrar(db, "versao", versaoId, "liberada_publicacao", ator.id);
  return { ok: true };
}

// Impresso: dupla aprovação (coordenador E diretor) na MESMA versão, cada um seu cargo.
export function aprovarImpresso(db: Store, ator: Ator, versaoId: string): { ok: boolean; erro?: string } {
  if (!can(ator.cargos, "aprovar_impresso")) return { ok: false, erro: "Aprovação de impresso é do Diretor/Coordenador." };
  const cargo = cargoAprovador(ator); if (!cargo) return { ok: false, erro: "Cargo aprovador não identificado." };
  if (db.aprovacoes.some(a => a.versaoId === versaoId && a.cargo === cargo && a.ativa)) return { ok: false, erro: `Já existe aprovação ativa do ${cargo} nesta versão.` };
  db.aprovacoes.push({ id: uid("apr"), versaoId, usuarioId: ator.id, cargo, decisao: "aprovar", ativa: true, createdAt: agora() });
  registrar(db, "versao", versaoId, `aprovacao_impresso:${cargo}`, ator.id);
  const temAmbas = db.aprovacoes.some(a => a.versaoId === versaoId && a.cargo === "coordenador" && a.ativa)
    && db.aprovacoes.some(a => a.versaoId === versaoId && a.cargo === "diretor" && a.ativa);
  const v = db.versoes.find(x => x.id === versaoId); if (v && temAmbas) v.estado = "aprovada";
  return { ok: true };
}

// Monta o estado do checklist a partir do store (para validar_liberacao_impressao).
export function estadoLiberacao(db: Store, versaoId: string): EstadoLiberacao {
  const v = db.versoes.find(x => x.id === versaoId)!;
  const ped = db.pedidos.filter(p => p.subdemandaId === v.subdemandaId).slice(-1)[0];
  const coord = db.aprovacoes.some(a => a.versaoId === versaoId && a.cargo === "coordenador" && a.ativa && (a.decisao === "aprovar" || a.decisao === "aprovar_com_observacao"));
  const dir = db.aprovacoes.some(a => a.versaoId === versaoId && a.cargo === "diretor" && a.ativa && (a.decisao === "aprovar" || a.decisao === "aprovar_com_observacao"));
  const incompat = db.liberacoes.some(l => l.tipo === "impressao" && l.ativa && (() => { const vv = db.versoes.find(x => x.id === l.versaoId); return vv && vv.subdemandaId === v.subdemandaId && vv.id !== versaoId; })());
  return { versaoVigente: v.vigente, versaoEstado: v.estado, aprovacaoCoordenadorAtiva: coord, aprovacaoDiretorAtiva: dir, aprovacoesMesmaVersao: coord && dir,
    graficaSelecionada: !!ped?.graficaId, quantidade: ped?.quantidade, medidas: ped?.medidas, formato: ped?.formato, material: ped?.material, acabamento: ped?.acabamento,
    prazoInformado: !!ped?.prazo, localEntrega: ped?.localEntrega, existeLiberacaoIncompativel: !!incompat };
}

// Liberar impressão: MANUAL (Diretor/Coordenador), só com checklist completo.
export function liberarImpressao(db: Store, ator: Ator, versaoId: string): { ok: boolean; erro?: string; pendencias?: string[] } {
  if (!can(ator.cargos, "liberar_impressao")) return { ok: false, erro: "Liberação de impressão é do Diretor/Coordenador." };
  const pend = validarLiberacaoImpressao(estadoLiberacao(db, versaoId));
  if (pend.length) return { ok: false, erro: "Há pendências para liberar.", pendencias: pend };
  const v = db.versoes.find(x => x.id === versaoId)!;
  db.liberacoes.push({ id: uid("lib"), versaoId, tipo: "impressao", usuarioId: ator.id, cargo: cargoAprovador(ator)!, ativa: true, createdAt: agora() });
  v.estado = "liberada_impressao";
  const ped = db.pedidos.filter(p => p.subdemandaId === v.subdemandaId).slice(-1)[0];
  if (ped) { ped.versaoLiberadaId = versaoId; ped.status = "aguardando_confirmacao"; }
  registrar(db, "versao", versaoId, "liberada_impressao", ator.id);
  enfileirarEmail(db, "grafica@exemplo", "versao_liberada_impressao", "Versão liberada para impressão");
  return { ok: true };
}
