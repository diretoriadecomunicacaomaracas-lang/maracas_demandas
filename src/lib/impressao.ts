// Validação de "Liberar para impressão" (espelha validar_liberacao_impressao no banco).
// Uso no cliente/servidor para mostrar pendências amigáveis ANTES de tentar liberar.
// A autorização é sempre MANUAL (Diretor ou Coordenador), nunca automática.
export interface EstadoLiberacao {
  versaoVigente: boolean;
  versaoEstado: "rascunho" | "em_revisao" | "correcao_solicitada" | "substituida" | "aprovada" | "liberada_publicacao" | "liberada_impressao" | "cancelada";
  aprovacaoCoordenadorAtiva: boolean;
  aprovacaoDiretorAtiva: boolean;
  aprovacoesMesmaVersao: boolean;   // as duas aprovações pertencem exatamente a esta versão
  graficaSelecionada: boolean;
  quantidade?: string | null;
  medidas?: string | null;
  formato?: string | null;
  material?: string | null;
  acabamento?: string | null;
  prazoInformado: boolean;
  localEntrega?: string | null;
  existeLiberacaoIncompativel: boolean; // liberação ativa em outra versão da mesma subdemanda
}

export function validarLiberacaoImpressao(e: EstadoLiberacao): string[] {
  const p: string[] = [];
  if (!e.versaoVigente) p.push("A versão não é a versão vigente.");
  if (e.versaoEstado === "substituida" || e.versaoEstado === "cancelada") p.push("A versão está substituída ou cancelada.");
  if (!e.aprovacaoCoordenadorAtiva) p.push("Falta a aprovação ativa do Coordenador nesta versão.");
  if (!e.aprovacaoDiretorAtiva) p.push("Falta a aprovação ativa do Diretor nesta versão.");
  if (!e.aprovacoesMesmaVersao) p.push("As duas aprovações devem pertencer exatamente à mesma versão.");
  if (!e.graficaSelecionada) p.push("Selecione a gráfica responsável.");
  if (!e.quantidade?.trim()) p.push("Informe a quantidade.");
  if (!e.medidas?.trim() && !e.formato?.trim()) p.push("Informe medidas ou formato.");
  if (!e.material?.trim()) p.push("Informe o material.");
  if (!e.acabamento?.trim()) p.push("Informe o acabamento.");
  if (!e.prazoInformado) p.push("Informe o prazo.");
  if (!e.localEntrega?.trim()) p.push("Informe o local de entrega.");
  if (e.existeLiberacaoIncompativel) p.push("Já existe uma liberação de impressão ativa em outra versão desta subdemanda.");
  return p;
}
export const podeLiberarImpressao = (e: EstadoLiberacao): boolean => validarLiberacaoImpressao(e).length === 0;
