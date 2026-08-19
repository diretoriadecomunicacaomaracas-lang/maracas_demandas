"use server";
import { getAtor } from "@/server/context";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { can } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

async function guard() {
  const ator = await getAtor();
  if (!ator || !can(ator.cargos, "administrar_usuarios")) return null;
  return ator;
}
async function audit(admin: any, entidade: string, id: string | null, acao: string, autor: string, extra?: any) {
  await admin.from("auditoria").insert({ entidade, entidade_id: id, acao, autor_id: autor, valor_novo: extra ?? null });
}
const ok = { ok: true as const }; const negado = { ok: false as const, erro: "Sem permissão." };

// ---------- SECRETARIAS ----------
export async function criarSecretaria(nome: string) {
  const a = await guard(); if (!a) return negado; if (!nome.trim()) return { ok: false, erro: "Informe o nome." };
  const admin = createSupabaseAdmin(); const { data, error } = await admin.from("secretarias").insert({ nome: nome.trim() }).select("id").single();
  if (error) return { ok: false, erro: "Falha ao criar." }; await audit(admin, "secretaria", data.id, "secretaria_criada", a.id, { nome });
  revalidatePath("/app/admin"); return ok;
}
export async function editarSecretaria(id: string, nome: string) {
  const a = await guard(); if (!a) return negado; const admin = createSupabaseAdmin();
  await admin.from("secretarias").update({ nome: nome.trim() }).eq("id", id); await audit(admin, "secretaria", id, "secretaria_editada", a.id, { nome });
  revalidatePath("/app/admin"); return ok;
}
export async function toggleSecretaria(id: string, ativar: boolean) {
  const a = await guard(); if (!a) return negado; const admin = createSupabaseAdmin();
  await admin.from("secretarias").update({ deleted_at: ativar ? null : new Date().toISOString() }).eq("id", id);
  await audit(admin, "secretaria", id, ativar ? "secretaria_reativada" : "secretaria_desativada", a.id);
  revalidatePath("/app/admin"); return ok;
}

// ---------- UNIDADES / SETORES ----------
export async function criarUnidade(secretariaId: string, nome: string) {
  const a = await guard(); if (!a) return negado; if (!nome.trim() || !secretariaId) return { ok: false, erro: "Nome e secretaria são obrigatórios." };
  const admin = createSupabaseAdmin(); const { data, error } = await admin.from("unidades").insert({ nome: nome.trim(), secretaria_id: secretariaId }).select("id").single();
  if (error) return { ok: false, erro: "Falha ao criar." }; await audit(admin, "unidade", data.id, "unidade_criada", a.id, { nome, secretariaId });
  revalidatePath("/app/admin"); return ok;
}
export async function editarUnidade(id: string, patch: { nome?: string; secretaria_id?: string }) {
  const a = await guard(); if (!a) return negado; const admin = createSupabaseAdmin();
  await admin.from("unidades").update(patch).eq("id", id); await audit(admin, "unidade", id, "unidade_editada", a.id, patch);
  revalidatePath("/app/admin"); return ok;
}
export async function toggleUnidade(id: string, ativar: boolean) {
  const a = await guard(); if (!a) return negado; const admin = createSupabaseAdmin();
  await admin.from("unidades").update({ deleted_at: ativar ? null : new Date().toISOString() }).eq("id", id);
  await audit(admin, "unidade", id, ativar ? "unidade_reativada" : "unidade_desativada", a.id);
  revalidatePath("/app/admin"); return ok;
}

// ---------- GRÁFICAS ----------
export async function criarGrafica(p: { nome: string; contato_email?: string }) {
  const a = await guard(); if (!a) return negado; if (!p.nome.trim()) return { ok: false, erro: "Informe o nome." };
  const admin = createSupabaseAdmin(); const { data, error } = await admin.from("graficas").insert({ nome: p.nome.trim(), contato_email: p.contato_email || null }).select("id").single();
  if (error) return { ok: false, erro: "Falha ao criar." }; await audit(admin, "grafica", data.id, "grafica_criada", a.id, p);
  revalidatePath("/app/admin"); return ok;
}
export async function editarGrafica(id: string, patch: { nome?: string; contato_email?: string | null }) {
  const a = await guard(); if (!a) return negado; const admin = createSupabaseAdmin();
  await admin.from("graficas").update(patch).eq("id", id); await audit(admin, "grafica", id, "grafica_editada", a.id, patch);
  revalidatePath("/app/admin"); return ok;
}
export async function toggleGrafica(id: string, ativa: boolean) {
  const a = await guard(); if (!a) return negado; const admin = createSupabaseAdmin();
  await admin.from("graficas").update({ ativa }).eq("id", id); await audit(admin, "grafica", id, ativa ? "grafica_ativada" : "grafica_desativada", a.id);
  revalidatePath("/app/admin"); return ok;
}

// ---------- GRUPOS (Bate-papo) ----------
export async function criarGrupo(p: { nome: string; descricao?: string }) {
  const a = await guard(); if (!a) return negado; if (!p.nome.trim()) return { ok: false, erro: "Informe o nome." };
  const admin = createSupabaseAdmin(); const { data, error } = await admin.from("grupos_conversa").insert({ nome: p.nome.trim(), descricao: p.descricao || null }).select("id").single();
  if (error) return { ok: false, erro: "Falha ao criar." }; await audit(admin, "grupo", data.id, "grupo_criado", a.id, p);
  revalidatePath("/app/admin"); return ok;
}
export async function editarGrupo(id: string, patch: { nome?: string; descricao?: string | null; arquivado?: boolean }) {
  const a = await guard(); if (!a) return negado; const admin = createSupabaseAdmin();
  await admin.from("grupos_conversa").update(patch).eq("id", id); await audit(admin, "grupo", id, "grupo_editado", a.id, patch);
  revalidatePath("/app/admin"); return ok;
}
export async function setMembroGrupo(grupoId: string, usuarioId: string, incluir: boolean) {
  const a = await guard(); if (!a) return negado; const admin = createSupabaseAdmin();
  if (incluir) await admin.from("grupo_membros").upsert({ grupo_id: grupoId, usuario_id: usuarioId }, { onConflict: "grupo_id,usuario_id", ignoreDuplicates: true });
  else await admin.from("grupo_membros").delete().eq("grupo_id", grupoId).eq("usuario_id", usuarioId);
  await audit(admin, "grupo", grupoId, incluir ? "membro_incluido" : "membro_removido", a.id, { usuarioId });
  revalidatePath("/app/admin"); revalidatePath("/app/conversas"); return ok;
}

// ---------- USUÁRIOS ----------
export async function toggleUsuario(id: string, ativo: boolean) {
  const a = await guard(); if (!a) return negado; if (id === a.id && !ativo) return { ok: false, erro: "Você não pode desativar a própria conta." };
  const admin = createSupabaseAdmin();
  await admin.from("usuarios").update({ situacao: ativo ? "ativa" : "inativa" }).eq("id", id);
  await audit(admin, "usuario", id, ativo ? "usuario_reativado" : "usuario_desativado", a.id);
  revalidatePath("/app/admin"); return ok;
}
// Cria usuário via CONVITE seguro (a pessoa define a própria senha). Requer SMTP p/ entrega.
export async function criarUsuario(p: { nome: string; email: string; ambiente: "interno" | "solicitante" | "grafica"; cargoChave?: string; secretariaId?: string; unidadeId?: string; graficaId?: string }) {
  const a = await guard(); if (!a) return negado;
  if (!p.nome.trim() || !p.email.trim()) return { ok: false, erro: "Nome e e-mail são obrigatórios." };
  const admin = createSupabaseAdmin();
  const site = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const { data: inv, error: e1 } = await admin.auth.admin.inviteUserByEmail(p.email.trim(), { redirectTo: `${site}/ativar` });
  if (e1 || !inv?.user) return { ok: false, erro: `Não foi possível convidar (verifique SMTP): ${e1?.message ?? ""}` };
  const uid = inv.user.id;
  await admin.from("usuarios").upsert({ id: uid, nome: p.nome.trim(), email: p.email.trim(), ambiente_principal: p.ambiente, secretaria_id: p.secretariaId ?? null, unidade_id: p.unidadeId ?? null, grafica_id: p.graficaId ?? null, situacao: "aguardando_ativacao" });
  if (p.cargoChave) { const { data: c } = await admin.from("cargos").select("id").eq("chave", p.cargoChave).maybeSingle(); if (c) await admin.from("usuario_cargos").upsert({ usuario_id: uid, cargo_id: c.id }, { onConflict: "usuario_id,cargo_id", ignoreDuplicates: true }); }
  await audit(admin, "usuario", uid, "usuario_criado", a.id, { email: p.email, ambiente: p.ambiente });
  revalidatePath("/app/admin"); return { ok: true, viaConvite: true };
}
