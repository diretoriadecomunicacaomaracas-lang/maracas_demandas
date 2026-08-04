// Validação pura da aprovação de solicitação → demanda (usada no servidor e testável).
export interface DadosAprovacao {
  briefingInterno?: string | null;
  tipo?: string | null;
  area?: string | null;       // área/fluxo operacional
  prazo?: string | null;
  prioridade?: string | null;
  responsavelId?: string | null;
  aguardandoDistribuicao?: boolean; // decisão explícita de deixar sem responsável
}
export function validarAprovacaoDemanda(d: DadosAprovacao): string[] {
  const p: string[] = [];
  if (!d.briefingInterno?.trim()) p.push("Preencha o briefing interno consolidado.");
  if (!d.tipo?.trim()) p.push("Defina o tipo da demanda.");
  if (!d.area?.trim()) p.push("Defina a área/fluxo.");
  if (!d.prazo?.trim()) p.push("Defina o prazo.");
  if (!d.prioridade?.trim()) p.push("Defina a prioridade.");
  if (!d.responsavelId && !d.aguardandoDistribuicao)
    p.push("Escolha o responsável principal ou marque explicitamente 'deixar aguardando distribuição'.");
  return p;
}
export const podeAprovarDemanda = (d: DadosAprovacao) => validarAprovacaoDemanda(d).length === 0;
