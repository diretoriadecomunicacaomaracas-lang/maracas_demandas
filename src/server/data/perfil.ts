"use server";
import { getAtor } from "@/server/context";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

// Atualiza APENAS o próprio nome/avatar (nunca cargo/permissões/secretaria).
// Usa o cliente admin no servidor, restrito a auth.uid() do usuário logado.
export async function atualizarMeuPerfil(dados: { nome?: string; avatarUrl?: string | null }) {
  const ator = await getAtor(); if (!ator) return { ok: false, erro: "Não autenticado." };
  const patch: Record<string, any> = {};
  if (typeof dados.nome === "string") { if (!dados.nome.trim()) return { ok: false, erro: "Nome não pode ficar vazio." }; patch.nome = dados.nome.trim(); }
  if (dados.avatarUrl !== undefined) patch.avatar_url = dados.avatarUrl || null;
  if (!Object.keys(patch).length) return { ok: false, erro: "Nada para salvar." };
  const admin = createSupabaseAdmin();
  const { error } = await admin.from("usuarios").update(patch).eq("id", ator.id);
  if (error) return { ok: false, erro: "Falha ao salvar o perfil." };
  await admin.from("auditoria").insert({ entidade: "usuario", entidade_id: ator.id, acao: "perfil_atualizado", autor_id: ator.id, valor_novo: patch });
  revalidatePath("/app/perfil");
  return { ok: true };
}
