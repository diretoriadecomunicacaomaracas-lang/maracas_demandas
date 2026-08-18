"use server";
import { createSupabaseServer } from "@/lib/supabase-server";
export async function listarInternos() {
  const sb = createSupabaseServer();
  const { data } = await sb.from("usuarios").select("id,nome,avatar_url,usuario_cargos(cargos(chave,nome))")
    .eq("ambiente_principal", "interno").is("deleted_at", null).order("nome");
  return (data ?? []).map((u: any) => ({
    id: u.id, nome: u.nome, avatarUrl: u.avatar_url ?? null,
    funcao: u.usuario_cargos?.[0]?.cargos?.nome ?? "Interno",
    cargoChave: u.usuario_cargos?.[0]?.cargos?.chave ?? null,
  }));
}
export async function mapaUsuarios(ids: string[]) {
  if (!ids.length) return new Map<string, { nome: string; avatarUrl: string | null }>();
  const sb = createSupabaseServer();
  const { data } = await sb.from("usuarios").select("id,nome,avatar_url").in("id", ids);
  return new Map((data ?? []).map((u: any) => [u.id, { nome: u.nome, avatarUrl: u.avatar_url ?? null }]));
}
