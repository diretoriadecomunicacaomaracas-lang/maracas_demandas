"use server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAtor } from "@/server/context";
import { revalidatePath } from "next/cache";
import { notificarUsuarios } from "@/server/notify";
import { mapaUsuarios } from "@/server/data/usuarios";

export async function listarComentarios(subId: string) {
  const sb = createSupabaseServer();
  const { data } = await sb.from("comentarios").select("id,autor_id,conteudo,responde_a,editada,created_at").eq("subdemanda_id", subId).is("deleted_at", null).order("created_at");
  const ids = [...new Set((data ?? []).map((c: any) => c.autor_id))];
  const m = await mapaUsuarios(ids);
  return (data ?? []).map((c: any) => ({ ...c, autor: m.get(c.autor_id)?.nome ?? "?", avatarUrl: m.get(c.autor_id)?.avatarUrl ?? null }));
}
// menções: recebe ids dos usuários mencionados (o cliente resolve @nome → id via lista de internos)
export async function comentar(subId: string, conteudo: string, mencoes: string[] = [], respondeA?: string) {
  const ator = await getAtor(); if (!ator || ator.ambiente !== "interno") return { ok: false, erro: "Comentário é interno." };
  if (!conteudo.trim()) return { ok: false, erro: "Escreva algo." };
  const sb = createSupabaseServer();
  const { data: c } = await sb.from("comentarios").insert({ subdemanda_id: subId, autor_id: ator.id, conteudo, responde_a: respondeA ?? null }).select("id").single();
  for (const u of mencoes) if (c?.id) await sb.from("comentario_mencoes").insert({ comentario_id: c.id, usuario_id: u });
  const alvo = mencoes.filter((u) => u !== ator.id);
  if (alvo.length) await notificarUsuarios(alvo, "mencao", "Você foi mencionado em um comentário", `/app/demandas/${subId}`);
  revalidatePath(`/app/demandas/${subId}`); return { ok: true };
}
export async function editarComentario(comentarioId: string, subId: string, conteudo: string) {
  const ator = await getAtor(); if (!ator) return { ok: false, erro: "Não autenticado." };
  const sb = createSupabaseServer();
  const { data: c } = await sb.from("comentarios").select("autor_id").eq("id", comentarioId).maybeSingle();
  if (c?.autor_id !== ator.id) return { ok: false, erro: "Só o autor edita." };
  await sb.from("comentarios").update({ conteudo, editada: true }).eq("id", comentarioId);
  revalidatePath(`/app/demandas/${subId}`); return { ok: true };
}
export async function excluirComentario(comentarioId: string, subId: string) {
  const ator = await getAtor(); if (!ator) return { ok: false, erro: "Não autenticado." };
  const sb = createSupabaseServer();
  const { data: c } = await sb.from("comentarios").select("autor_id").eq("id", comentarioId).maybeSingle();
  const moderador = ator.cargos.some((x) => ["administrador", "diretor", "coordenador"].includes(x));
  if (c?.autor_id !== ator.id && !moderador) return { ok: false, erro: "Sem permissão." };
  await sb.from("comentarios").update({ deleted_at: new Date().toISOString() }).eq("id", comentarioId);
  revalidatePath(`/app/demandas/${subId}`); return { ok: true };
}
