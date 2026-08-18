// Tipos do domínio (framework-agnósticos). Reutilizados pela app (Next) e pelos testes (Node).
import type { CargoChave } from "../lib/permissions.ts";
export type { CargoChave };
export type Ambiente = "interno" | "solicitante" | "grafica";
export type TipoDemanda = "digital" | "audiovisual" | "impresso";
export type Prioridade = "baixa" | "media" | "alta" | "emergencial";
export type SituacaoDemanda = "ativa" | "arquivada" | "excluida_logicamente";
export type EstadoVersao =
  | "rascunho" | "em_revisao" | "correcao_solicitada" | "substituida"
  | "aprovada" | "liberada_publicacao" | "liberada_impressao" | "cancelada";

export interface Ator { id: string; nome: string; cargos: CargoChave[]; secretariaId?: string | null; graficaId?: string | null; ambiente: Ambiente; }

export interface Secretaria { id: string; nome: string; unidades: { id: string; nome: string }[]; }
export interface Grafica { id: string; nome: string; ativa: boolean; }

export interface Solicitacao {
  id: string; protocolo: string; titulo: string; descricao?: string; tipo?: TipoDemanda;
  secretariaId: string; unidadeId?: string | null; criadoPor: string;
  prazoDesejado?: string | null; restrita: boolean; statusExterno: string; resultado?: string | null;
  autorizados: string[]; createdAt: string; deletedAt?: string | null;
}
export interface Mensagem { id: string; refId: string; autorId: string; origem: Ambiente; conteudo: string; createdAt: string; }

export interface Demanda { id: string; titulo: string; campanha: boolean; solicitacaoId?: string | null; prioridade: Prioridade; situacao: SituacaoDemanda; finalizadaEm?: string | null; createdAt: string; }
export interface Subdemanda {
  id: string; demandaId: string; titulo: string; tipo: TipoDemanda; responsavelId?: string | null;
  membros: string[]; prioridade: Prioridade; etapa: string; macroetapa: string;
  prazo?: string | null; dataPublicacao?: string | null; canal?: string | null; secretariaId?: string | null;
  situacao: SituacaoDemanda; createdAt: string;
}
export interface Versao {
  id: string; subdemandaId: string; numero: number; titulo?: string | null; linkDrive: string; driveFileId: string | null;
  autorId?: string | null; estado: EstadoVersao; vigente: boolean; createdAt: string;
}
export interface LinkDrive { id: string; subdemandaId: string; tipo: string; url: string; driveFileId: string | null; autorId?: string | null; createdAt: string; }
export interface Aprovacao { id: string; versaoId: string; usuarioId: string; cargo: CargoChave; decisao: "aprovar" | "aprovar_com_observacao" | "solicitar_correcao" | "reprovar"; observacao?: string | null; ativa: boolean; createdAt: string; }
export interface Liberacao { id: string; versaoId: string; tipo: "publicacao" | "impressao"; usuarioId: string; cargo: CargoChave; ativa: boolean; createdAt: string; }
export interface PedidoImpressao {
  id: string; subdemandaId: string; graficaId?: string | null; versaoLiberadaId?: string | null;
  quantidade?: string | null; medidas?: string | null; formato?: string | null; material?: string | null; acabamento?: string | null;
  localEntrega?: string | null; prazo?: string | null; status: string; createdAt: string;
}
export interface ConfirmacaoGrafica { id: string; pedidoId: string; versaoId: string; usuarioId: string; graficaId?: string | null; ativa: boolean; createdAt: string; }
export interface EventoCalendario { id: string; subdemandaId?: string | null; titulo: string; inicioUTC: string; duracaoMin?: number | null; canal?: string | null; status?: string | null; }
export interface Notificacao { id: string; destinatarioId: string; canal: "interno" | "email"; tipo: string; titulo: string; refUrl?: string | null; lida: boolean; createdAt: string; }
export interface EmailEnfileirado { id: string; para: string; assunto: string; tipo: string; situacao: "pendente" | "enviado" | "falha"; createdAt: string; }
export interface GrupoConversa { id: string; nome: string; membros: string[]; arquivado: boolean; }
export interface MensagemChat { id: string; grupoId: string; autorId: string; conteudo: string; mencoes: string[]; respondeA?: string | null; editada: boolean; deletedAt?: string | null; createdAt: string; }
export interface Leitura { mensagemId: string; usuarioId: string; }
export interface Auditoria { id: string; entidade: string; entidadeId?: string | null; acao: string; autorId?: string | null; valorAnterior?: unknown; valorNovo?: unknown; justificativa?: string | null; createdAt: string; }
