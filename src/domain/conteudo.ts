// Campos operacionais de "Roteiro e conteúdo" por tipo de demanda.
export type CampoTipo = "texto" | "textoLongo" | "data" | "hora";
export interface CampoDef { chave: string; label: string; tipo: CampoTipo; }

export const CONTEUDO_POR_TIPO: Record<"digital" | "audiovisual" | "impresso", CampoDef[]> = {
  digital: [
    { chave: "texto_card", label: "Texto do card", tipo: "textoLongo" },
    { chave: "legenda", label: "Legenda", tipo: "textoLongo" },
    { chave: "chamada", label: "Chamada", tipo: "texto" },
    { chave: "hashtags", label: "Hashtags", tipo: "texto" },
    { chave: "canais", label: "Canais de publicação", tipo: "texto" },
    { chave: "observacoes", label: "Observações", tipo: "textoLongo" },
  ],
  audiovisual: [
    { chave: "roteiro", label: "Roteiro", tipo: "textoLongo" },
    { chave: "cenas", label: "Divisão por cenas", tipo: "textoLongo" },
    { chave: "falas", label: "Falas", tipo: "textoLongo" },
    { chave: "entrevistados", label: "Entrevistados", tipo: "texto" },
    { chave: "local", label: "Local", tipo: "texto" },
    { chave: "data_gravacao", label: "Data de gravação", tipo: "data" },
    { chave: "hora_gravacao", label: "Horário de gravação", tipo: "hora" },
    { chave: "duracao", label: "Duração prevista", tipo: "texto" },
    { chave: "formato", label: "Formato", tipo: "texto" },
    { chave: "captacao", label: "Orientação de captação", tipo: "textoLongo" },
    { chave: "legenda", label: "Texto de legenda", tipo: "textoLongo" },
    { chave: "canais", label: "Canais de publicação", tipo: "texto" },
  ],
  impresso: [
    { chave: "texto_peca", label: "Texto da peça", tipo: "textoLongo" },
    { chave: "medidas", label: "Medidas", tipo: "texto" },
    { chave: "quantidade", label: "Quantidade", tipo: "texto" },
    { chave: "material", label: "Material", tipo: "texto" },
    { chave: "acabamento", label: "Acabamento", tipo: "texto" },
    { chave: "local_entrega", label: "Local de entrega", tipo: "texto" },
    { chave: "prazo_grafica", label: "Prazo da gráfica", tipo: "data" },
    { chave: "obs_tecnicas", label: "Observações técnicas", tipo: "textoLongo" },
  ],
};
export function camposDe(tipo: string): CampoDef[] { return (CONTEUDO_POR_TIPO as any)[tipo] ?? CONTEUDO_POR_TIPO.digital; }

// Campos GERENCIAIS (só Diretor/Coordenador) x OPERACIONAIS (responsável/membros).
export const CAMPOS_GERENCIAIS = ["titulo", "tipo", "area", "prioridade", "prazo", "briefing_interno"] as const;
export const CAMPOS_OPERACIONAIS = ["resumo", "observacoes", "conteudo", "data_publicacao"] as const;
export type CampoGerencial = typeof CAMPOS_GERENCIAIS[number];
export type CampoOperacional = typeof CAMPOS_OPERACIONAIS[number];
