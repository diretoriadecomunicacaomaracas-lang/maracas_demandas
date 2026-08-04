"use server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAtor } from "@/server/context";
import { can } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function meusPedidos() {
  const sb = createSupabaseServer(); // RLS já restringe à gráfica do usuário
  const { data } = await sb.from("pedidos_impressao").select("*").order("created_at", { ascending: false });
  return data ?? [];
}
export async function confirmarVersao(pedidoId: string) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "confirmar_pedido_grafica")) return { ok: false, erro: "Ação exclusiva da gráfica." };
  const sb = createSupabaseServer();
  const { data: ped } = await sb.from("pedidos_impressao").select("id,versao_liberada_id,grafica_id").eq("id", pedidoId).single();
  if (!ped?.versao_liberada_id) return { ok: false, erro: "Não há versão liberada para confirmar." };
  await sb.from("confirmacoes_grafica").insert({ pedido_id: pedidoId, versao_id: ped.versao_liberada_id, usuario_id: ator.id, grafica_id: ator.graficaId, ativa: true });
  await sb.from("pedidos_impressao").update({ status: "pedido_confirmado" }).eq("id", pedidoId);
  revalidatePath("/grafica"); return { ok: true };
}
export async function atualizarProducao(pedidoId: string, status: string) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "confirmar_pedido_grafica")) return { ok: false, erro: "Ação exclusiva da gráfica." };
  const sb = createSupabaseServer(); await sb.from("pedidos_impressao").update({ status }).eq("id", pedidoId);
  await sb.from("auditoria").insert({ entidade: "pedido", entidade_id: pedidoId, acao: `producao:${status}`, autor_id: ator.id });
  revalidatePath("/grafica"); return { ok: true };
}
