"use server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAtor } from "@/server/context";
import { revalidatePath } from "next/cache";
export async function minhasNotificacoes() {
  const sb = createSupabaseServer();
  const { data } = await sb.from("notificacoes").select("*").eq("canal", "interno").order("created_at", { ascending: false }).limit(50);
  return data ?? [];
}
export async function contarNaoLidas() {
  const sb = createSupabaseServer();
  const { count } = await sb.from("notificacoes").select("*", { count: "exact", head: true }).eq("lida", false).eq("canal", "interno");
  return count ?? 0;
}
export async function marcarLida(id: string) {
  const ator = await getAtor(); if (!ator) return { ok: false };
  const sb = createSupabaseServer(); await sb.from("notificacoes").update({ lida: true }).eq("id", id);
  revalidatePath("/app/painel"); return { ok: true };
}
