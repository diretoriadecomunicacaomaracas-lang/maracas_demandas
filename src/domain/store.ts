// Camada de persistência abstrata. MemoryStore roda 100% local (sem credenciais).
// Uma implementação SupabaseStore (mesma interface) é plugada por variável de ambiente
// quando as credenciais existirem — ver ARQUITETURA.md e src/lib/supabase-*.
import type * as T from "./types.ts";

export interface Store {
  secretarias: T.Secretaria[]; graficas: T.Grafica[];
  solicitacoes: T.Solicitacao[]; solicitacaoMensagens: T.Mensagem[];
  demandas: T.Demanda[]; subdemandas: T.Subdemanda[];
  versoes: T.Versao[]; links: T.LinkDrive[];
  aprovacoes: T.Aprovacao[]; liberacoes: T.Liberacao[];
  pedidos: T.PedidoImpressao[]; confirmacoes: T.ConfirmacaoGrafica[]; pedidoMensagens: T.Mensagem[];
  eventos: T.EventoCalendario[];
  notificacoes: T.Notificacao[]; emails: T.EmailEnfileirado[];
  grupos: T.GrupoConversa[]; mensagens: T.MensagemChat[]; leituras: T.Leitura[];
  auditoria: T.Auditoria[];
}

export function novoStore(): Store {
  return {
    secretarias: [], graficas: [], solicitacoes: [], solicitacaoMensagens: [],
    demandas: [], subdemandas: [], versoes: [], links: [], aprovacoes: [], liberacoes: [],
    pedidos: [], confirmacoes: [], pedidoMensagens: [], eventos: [],
    notificacoes: [], emails: [], grupos: [], mensagens: [], leituras: [], auditoria: [],
  };
}

let _seq = 0;
export const uid = (p = "id") => `${p}_${(++_seq).toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
export const agora = () => new Date().toISOString();
