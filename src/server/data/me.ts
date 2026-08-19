"use server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAtor } from "@/server/context";

export async function getMe() {
  const ator = await getAtor(); if (!ator) return null;
  const sb = createSupabaseServer();
  let funcao = "Interno";
  if (ator.ambiente === "solicitante") funcao = "Solicitante";
  else if (ator.ambiente === "grafica") funcao = "Gráfica";
  else {
    const { data } = await sb.from("usuario_cargos").select("cargos(nome)").eq("usuario_id", ator.id).limit(1).maybeSingle();
    funcao = (data as any)?.cargos?.nome ?? "Interno";
  }
  const { data: perfil } = await sb.from("usuarios").select("avatar_url").eq("id", ator.id).maybeSingle();
  return { nome: ator.nome, email: ator.email, funcao, ambiente: ator.ambiente, avatarUrl: perfil?.avatar_url ?? null };
}

// Flags de navegação do usuário logado (visibilidade de menu; a segurança real é no servidor).
export async function meuAcesso() {
  const ator = await getAtor(); if (!ator) return { podeAdmin: false, ambiente: "solicitante" as const };
  const { can } = await import("@/lib/permissions");
  return { podeAdmin: can(ator.cargos, "administrar_usuarios"), ambiente: ator.ambiente };
}

export async function getNotificacoesTopo() {
  const sb = createSupabaseServer();
  const [{ data: itens }, { count }] = await Promise.all([
    sb.from("notificacoes").select("id,tipo,titulo,referencia_url,lida,created_at").eq("canal", "interno").order("created_at", { ascending: false }).limit(15),
    sb.from("notificacoes").select("*", { count: "exact", head: true }).eq("canal", "interno").eq("lida", false),
  ]);
  return { itens: itens ?? [], naoLidas: count ?? 0 };
}
export async function marcarTodasLidas() {
  const ator = await getAtor(); if (!ator) return { ok: false };
  const sb = createSupabaseServer();
  await sb.from("notificacoes").update({ lida: true }).eq("destinatario_id", ator.id).eq("lida", false);
  return { ok: true };
}
