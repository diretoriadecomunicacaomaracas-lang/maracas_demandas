"use server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAtor } from "@/server/context";
import { can } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function listarLinks(subId: string) {
  const sb = createSupabaseServer();
  const { data } = await sb.from("links_drive").select("id,tipo,titulo,descricao,url,autor_id,created_at").eq("subdemanda_id", subId).is("deleted_at", null).order("created_at", { ascending: false });
  return data ?? [];
}
export async function adicionarLinkRef(subId: string, dados: { tipo: string; titulo: string; url: string; descricao?: string }) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "editar_operacional")) return { ok: false, erro: "Sem permissão." };
  if (!dados.url?.trim()) return { ok: false, erro: "Informe a URL." };
  const sb = createSupabaseServer();
  const { error } = await sb.from("links_drive").insert({ subdemanda_id: subId, tipo: dados.tipo || "referencia", titulo: dados.titulo ?? null, descricao: dados.descricao ?? null, url: dados.url, autor_id: ator.id });
  if (error) return { ok: false, erro: "Falha ao adicionar link." };
  await sb.from("auditoria").insert({ entidade: "subdemanda", entidade_id: subId, acao: "link_adicionado", autor_id: ator.id, valor_novo: { url: dados.url, tipo: dados.tipo } });
  revalidatePath(`/app/demandas/${subId}`); return { ok: true };
}
export async function editarLinkRef(linkId: string, subId: string, descricao: string) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "editar_operacional")) return { ok: false, erro: "Sem permissão." };
  const sb = createSupabaseServer();
  await sb.from("links_drive").update({ descricao, updated_at: new Date().toISOString() }).eq("id", linkId);
  revalidatePath(`/app/demandas/${subId}`); return { ok: true };
}
export async function removerLinkRef(linkId: string, subId: string) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "editar_operacional")) return { ok: false, erro: "Sem permissão." };
  const sb = createSupabaseServer();
  await sb.from("links_drive").update({ deleted_at: new Date().toISOString() }).eq("id", linkId);
  await sb.from("auditoria").insert({ entidade: "subdemanda", entidade_id: subId, acao: "link_removido", autor_id: ator.id, valor_anterior: { linkId } });
  revalidatePath(`/app/demandas/${subId}`); return { ok: true };
}
