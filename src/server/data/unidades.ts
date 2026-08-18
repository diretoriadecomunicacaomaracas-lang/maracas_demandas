"use server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { getAtor } from "@/server/context";
import { can } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

// Unidades da secretaria informada (para o seletor do formulário). Somente da própria secretaria.
export async function unidadesDaSecretaria(secretariaId: string) {
  const sb = createSupabaseServer();
  const { data } = await sb.from("unidades").select("id,nome").eq("secretaria_id", secretariaId).is("deleted_at", null).order("nome");
  return data ?? [];
}
export async function todasUnidades() {
  const sb = createSupabaseServer();
  const { data } = await sb.from("unidades").select("id,nome,secretaria_id, secretarias(nome)").is("deleted_at", null).order("nome");
  return data ?? [];
}
// Cadastro administrativo de setor/unidade (guardado por permissão).
export async function criarUnidade(secretariaId: string, nome: string) {
  const ator = await getAtor();
  if (!ator || !can(ator.cargos, "administrar_usuarios")) return { ok: false, erro: "Sem permissão." };
  if (!nome.trim() || !secretariaId) return { ok: false, erro: "Informe secretaria e nome do setor." };
  const admin = createSupabaseAdmin(); // operação administrativa em tabela de referência
  const { error } = await admin.from("unidades").insert({ secretaria_id: secretariaId, nome: nome.trim() });
  if (error) return { ok: false, erro: "Falha ao cadastrar setor." };
  revalidatePath("/app/admin"); return { ok: true };
}
