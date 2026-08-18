"use server";
// Mantido por compatibilidade: delega para a ação real conectada ao Supabase.
export { criarSolicitacao as enviarSolicitacao } from "@/server/data/solicitacoes";
