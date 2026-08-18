// Mapa de status → rótulo + classe semântica (espelha 02_design_system.md).
export type StatusKey = string;
export const STATUS: Record<string, { label: string; tone: string }> = {
  planejamento:{label:"Planejamento",tone:"amarelo"}, distribuicao:{label:"Aguardando distribuição",tone:"amarelo"},
  criacao:{label:"Em criação",tone:"laranja"}, roteiro:{label:"Roteiro",tone:"laranja"},
  gravacao:{label:"Em gravação",tone:"laranja"}, edicao:{label:"Em edição",tone:"laranja"},
  revisao:{label:"Revisão interna",tone:"ciano"}, aprovacao:{label:"Aguardando aprovação",tone:"laranjaverm"},
  aprov_coord:{label:"Aguard. aprovação do Coordenador",tone:"laranjaverm"},
  aprov_dir:{label:"Aguard. aprovação do Diretor",tone:"laranjaverm"},
  correcao:{label:"Correção solicitada",tone:"vermelho"}, aprovado:{label:"Aprovado",tone:"verde"},
  aprov_dois:{label:"Aprovado pelos dois",tone:"verde"}, liberado_imp:{label:"Liberado para impressão",tone:"verde"},
  conf_grafica:{label:"Aguard. confirmação da gráfica",tone:"amarelo"}, pedido_conf:{label:"Pedido confirmado",tone:"laranja"},
  prod_grafica:{label:"Em produção gráfica",tone:"laranja"}, transporte:{label:"Em transporte",tone:"laranja"},
  entregue:{label:"Entregue",tone:"verde"}, conferido:{label:"Conferido",tone:"verde"},
  pub_aguard:{label:"Aguardando publicação",tone:"amarelo"}, publicado:{label:"Publicado",tone:"verde"},
  finalizado:{label:"Finalizado",tone:"verde"}, pausado:{label:"Pausado",tone:"neutro"}, cancelado:{label:"Cancelado",tone:"neutro"},
};
// "Atrasado" é indicador calculado, nunca status.
export function estaAtrasada(prazo: Date | null, macroetapa: string): number {
  if (!prazo) return 0;
  const terminais = ["concluido","finalizado","cancelado"];
  if (terminais.includes(macroetapa)) return 0;
  const diff = Date.now() - prazo.getTime();
  return diff > 0 ? Math.floor(diff / 86400000) : 0;
}
