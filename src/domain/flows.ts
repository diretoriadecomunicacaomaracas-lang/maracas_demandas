// Fluxos em duas camadas e transições válidas por tipo (usado pelo Kanban — validação no servidor).
import type { TipoDemanda } from "./types.ts";

export const FLUXOS: Record<TipoDemanda, string[]> = {
  digital: ["planejamento","distribuicao","criacao","revisao","aprovacao","correcao","aprovado","pub_aguard","publicado","finalizado"],
  audiovisual: ["planejamento","roteiro","gravacao_aguard","gravacao","edicao_aguard","edicao","revisao","aprovacao","correcao","aprovado","pub_aguard","publicado","finalizado"],
  impresso: ["planejamento","criacao","revisao","aprov_coord","aprov_dir","aprov_dois","liberado_imp","conf_grafica","pedido_conf","prod_grafica","pronto","transporte","entregue","conferido","finalizado"],
};

export const MACRO: Record<string, string> = {
  planejamento:"planejamento", distribuicao:"planejamento",
  criacao:"producao", roteiro:"producao", gravacao_aguard:"producao", gravacao:"producao", edicao_aguard:"producao", edicao:"producao",
  revisao:"revisao_aprovacao", aprovacao:"revisao_aprovacao", aprov_coord:"revisao_aprovacao", aprov_dir:"revisao_aprovacao",
  correcao:"revisao_aprovacao", aprovado:"revisao_aprovacao", aprov_dois:"revisao_aprovacao",
  liberado_imp:"preparacao_saida", conf_grafica:"preparacao_saida", pedido_conf:"preparacao_saida",
  prod_grafica:"preparacao_saida", pronto:"preparacao_saida", transporte:"preparacao_saida",
  pub_aguard:"preparacao_saida",
  publicado:"concluido", entregue:"concluido", conferido:"concluido", finalizado:"finalizado",
};

// Transição válida = vizinha no fluxo (avançar 1) ou retroceder para etapa anterior de produção.
export function transicaoValida(tipo: TipoDemanda, de: string, para: string): boolean {
  const f = FLUXOS[tipo]; const i = f.indexOf(de); const j = f.indexOf(para);
  if (i < 0 || j < 0) return false;
  if (j === i + 1) return true;              // avanço normal
  if (j < i) return true;                     // devolução (retrocesso permitido em produção)
  return false;
}
// Etapas que exigem ação crítica (aprovação/liberação) — não podem ser puladas por arrastar.
export const ETAPAS_CRITICAS = new Set(["aprovado","aprov_dois","liberado_imp","publicado"]);

// Primeira etapa (camada 2) de um tipo que pertence à macroetapa alvo. Usado pelo Kanban por macro.
export function etapaAlvoParaMacro(tipo: import("./types.ts").TipoDemanda, macro: string): string | null {
  for (const e of FLUXOS[tipo]) if ((MACRO[e] ?? "") === macro) return e;
  return null;
}
export const MACROS_KANBAN: { chave: string; nome: string; cor: string }[] = [
  { chave: "planejamento", nome: "Planejamento", cor: "var(--amarelo)" },
  { chave: "producao", nome: "Em produção", cor: "var(--laranja)" },
  { chave: "revisao_aprovacao", nome: "Revisão e aprovação", cor: "var(--laranjaverm)" },
  { chave: "preparacao_saida", nome: "Preparação p/ saída", cor: "var(--amarelo)" },
  { chave: "concluido", nome: "Concluído", cor: "var(--verde)" },
  { chave: "finalizado", nome: "Finalizado", cor: "var(--verde)" },
];

// ---- Kanban por ETAPA (camada 2) — correção do mapeamento coluna→estado ----
import type { TipoDemanda as _TD } from "./types.ts";

export const ETAPA_LABELS: Record<string, string> = {
  planejamento:"Planejamento", distribuicao:"Aguardando distribuição", criacao:"Em criação",
  roteiro:"Roteiro", gravacao_aguard:"Aguardando gravação", gravacao:"Em gravação",
  edicao_aguard:"Aguardando edição", edicao:"Em edição", revisao:"Revisão interna",
  aprovacao:"Aguardando aprovação", aprov_coord:"Aguard. aprovação do Coordenador",
  aprov_dir:"Aguard. aprovação do Diretor", correcao:"Correção solicitada",
  aprovado:"Aprovado", aprov_dois:"Aprovado pelos dois", liberado_imp:"Liberado para impressão",
  conf_grafica:"Aguard. confirmação da gráfica", pedido_conf:"Pedido confirmado",
  prod_grafica:"Em produção gráfica", pronto:"Pronto", transporte:"Em transporte",
  entregue:"Entregue", conferido:"Conferido", pub_aguard:"Aguardando publicação",
  publicado:"Publicado", finalizado:"Finalizado",
};

// Transições permitidas por ARRASTE (etapas normais de produção/revisão).
// Etapas de aprovação/liberação/produção-gráfica avançam por AÇÃO, não pelo arraste.
export const TRANSICOES_KANBAN: Record<_TD, Record<string, string[]>> = {
  digital: {
    planejamento: ["distribuicao", "criacao"],
    distribuicao: ["criacao", "planejamento"],
    criacao: ["revisao", "distribuicao"],
    revisao: ["criacao", "aprovacao"],
    aprovacao: ["revisao", "correcao"],
    correcao: ["criacao", "revisao"],
  },
  audiovisual: {
    planejamento: ["roteiro"],
    roteiro: ["gravacao_aguard", "planejamento"],
    gravacao_aguard: ["gravacao", "roteiro"],
    gravacao: ["edicao_aguard", "gravacao_aguard"],
    edicao_aguard: ["edicao", "gravacao"],
    edicao: ["revisao", "edicao_aguard"],
    revisao: ["edicao", "aprovacao"],
    aprovacao: ["revisao", "correcao"],
    correcao: ["edicao", "revisao"],
  },
  impresso: {
    planejamento: ["criacao"],
    criacao: ["revisao", "planejamento"],
    revisao: ["criacao", "aprov_coord"],
    aprov_coord: ["revisao"],
  },
};

export function destinosKanban(tipo: _TD, etapa: string): string[] {
  return TRANSICOES_KANBAN[tipo]?.[etapa] ?? [];
}
export function transicaoKanbanValida(tipo: _TD, de: string, para: string): boolean {
  return destinosKanban(tipo, de).includes(para);
}
export function podeArrastar(tipo: _TD, etapa: string): boolean {
  return (TRANSICOES_KANBAN[tipo]?.[etapa]?.length ?? 0) > 0;
}
export function mensagemDestinos(tipo: _TD, etapa: string): string {
  const d = destinosKanban(tipo, etapa).map((e) => `“${ETAPA_LABELS[e] ?? e}”`);
  const origem = ETAPA_LABELS[etapa] ?? etapa;
  if (!d.length) return `Esta demanda está em “${origem}”. Esta etapa avança por ações (aprovação/liberação), não pelo arraste.`;
  return `Esta demanda está em “${origem}”. As próximas etapas permitidas são ${d.join(" e ")}.`;
}
