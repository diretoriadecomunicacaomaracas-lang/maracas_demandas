"use server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAtor } from "@/server/context";
import { can } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function listarChecklist(subId: string) {
  const sb = createSupabaseServer();
  const { data } = await sb.from("checklists").select("id,descricao,concluido,ordem,responsavel_id").eq("subdemanda_id", subId).is("deleted_at", null).order("ordem");
  return data ?? [];
}
export async function adicionarItem(subId: string, descricao: string) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "editar_operacional")) return { ok: false, erro: "Sem permissão." };
  if (!descricao.trim()) return { ok: false, erro: "Descreva o item." };
  const sb = createSupabaseServer();
  const { data: max } = await sb.from("checklists").select("ordem").eq("subdemanda_id", subId).order("ordem", { ascending: false }).limit(1).maybeSingle();
  await sb.from("checklists").insert({ subdemanda_id: subId, descricao, ordem: (max?.ordem ?? 0) + 1, created_by: ator.id });
  revalidatePath(`/app/demandas/${subId}`); return { ok: true };
}
export async function alternarItem(itemId: string, subId: string, concluido: boolean) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "editar_operacional")) return { ok: false, erro: "Sem permissão." };
  const sb = createSupabaseServer();
  await sb.from("checklists").update({ concluido }).eq("id", itemId);
  await sb.from("auditoria").insert({ entidade: "subdemanda", entidade_id: subId, acao: concluido ? "checklist_concluido" : "checklist_reaberto", autor_id: ator.id, valor_novo: { itemId } });
  revalidatePath(`/app/demandas/${subId}`); return { ok: true };
}
export async function atribuirItem(itemId: string, subId: string, usuarioId: string | null) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "editar_operacional")) return { ok: false, erro: "Sem permissão." };
  const sb = createSupabaseServer();
  await sb.from("checklists").update({ responsavel_id: usuarioId }).eq("id", itemId);
  revalidatePath(`/app/demandas/${subId}`); return { ok: true };
}
export async function removerItem(itemId: string, subId: string) {
  const ator = await getAtor(); if (!ator || !can(ator.cargos, "editar_operacional")) return { ok: false, erro: "Sem permissão." };
  const sb = createSupabaseServer();
  await sb.from("checklists").update({ deleted_at: new Date().toISOString() }).eq("id", itemId);
  revalidatePath(`/app/demandas/${subId}`); return { ok: true };
}
