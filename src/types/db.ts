// Tipos utilitários do domínio (subconjunto). Para tipos gerados do schema,
// use `supabase gen types typescript` na fase de integração.
export type Ambiente = "interno" | "solicitante" | "grafica";
export type TipoDemanda = "digital" | "audiovisual" | "impresso";
export type EstadoVersao =
  | "rascunho" | "em_revisao" | "correcao_solicitada" | "substituida"
  | "aprovada" | "liberada_publicacao" | "liberada_impressao" | "cancelada";
export interface Usuario { id: string; nome: string; email: string; ambiente_principal: Ambiente; secretaria_id: string | null; }
export interface Subdemanda { id: string; titulo: string; tipo: TipoDemanda; etapa: string; macroetapa: string; prazo: string | null; }
