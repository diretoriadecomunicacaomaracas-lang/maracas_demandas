"use server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { getAtor } from "@/server/context";
import { notificarUsuarios } from "@/server/notify";
import { normalizar } from "@/domain/busca";
import { revalidatePath } from "next/cache";

async function ehMembro(grupoId: string, uid: string): Promise<boolean> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("grupo_membros").select("usuario_id").eq("grupo_id", grupoId).eq("usuario_id", uid).maybeSingle();
  return !!data;
}

// Grupos que o usuário participa + contagem de não lidas.
export async function listarGrupos() {
  const ator = await getAtor(); if (!ator) return [];
  const sb = createSupabaseServer();
  const { data: grupos } = await sb.from("grupos_conversa").select("id,nome,descricao").eq("arquivado", false).order("nome"); // RLS: só membros
  const ids = (grupos ?? []).map((g: any) => g.id);
  if (!ids.length) return [];
  const [{ data: msgs }, { data: lidas }] = await Promise.all([
    sb.from("mensagens").select("id,grupo_id,autor_id").in("grupo_id", ids).is("deleted_at", null),
    sb.from("mensagem_leituras").select("mensagem_id").eq("usuario_id", ator.id),
  ]);
  const lidasSet = new Set((lidas ?? []).map((l: any) => l.mensagem_id));
  const naoLidas = new Map<string, number>();
  for (const m of msgs ?? []) if (m.autor_id !== ator.id && !lidasSet.has(m.id)) naoLidas.set(m.grupo_id, (naoLidas.get(m.grupo_id) ?? 0) + 1);
  return (grupos ?? []).map((g: any) => ({ ...g, naoLidas: naoLidas.get(g.id) ?? 0 }));
}

// Mensagens de um grupo (marca como lidas ao abrir).
export async function listarMensagens(grupoId: string) {
  const ator = await getAtor(); if (!ator) return { itens: [] as any[] };
  const sb = createSupabaseServer();
  const { data } = await sb.from("mensagens")
    .select("id,autor_id,conteudo,responde_a,editada,created_at,usuarios(nome,avatar_url)")
    .eq("grupo_id", grupoId).is("deleted_at", null).order("created_at").limit(300); // RLS: só membros
  const itens = (data ?? []).map((m: any) => ({ id: m.id, autorId: m.autor_id, autorNome: m.usuarios?.nome ?? "?", autorAvatar: m.usuarios?.avatar_url ?? null, conteudo: m.conteudo, respondeA: m.responde_a, editada: m.editada, createdAt: m.created_at }));
  // marca como lidas (upsert idempotente) as que não são minhas
  const paraLer = itens.filter((m) => m.autorId !== ator.id).map((m) => ({ mensagem_id: m.id, usuario_id: ator.id }));
  if (paraLer.length) await sb.from("mensagem_leituras").upsert(paraLer, { onConflict: "mensagem_id,usuario_id", ignoreDuplicates: true });
  return { itens };
}

export async function enviarMensagem(grupoId: string, conteudo: string, respondeA?: string | null) {
  const ator = await getAtor(); if (!ator) return { ok: false, erro: "Não autenticado." };
  if (!conteudo.trim()) return { ok: false, erro: "Mensagem vazia." };
  if (!(await ehMembro(grupoId, ator.id))) return { ok: false, erro: "Você não participa deste grupo." };
  const admin = createSupabaseAdmin();
  const { data: msg, error } = await admin.from("mensagens").insert({ grupo_id: grupoId, autor_id: ator.id, conteudo: conteudo.trim(), responde_a: respondeA ?? null }).select("id").single();
  if (error || !msg) return { ok: false, erro: "Falha ao enviar." };
  // Menções: casa @token com nomes dos MEMBROS do grupo.
  const tokens = (conteudo.match(/@([\p{L}\p{N}._-]+)/gu) ?? []).map((t) => normalizar(t.slice(1)));
  if (tokens.length) {
    const { data: membros } = await admin.from("grupo_membros").select("usuario_id, usuarios(nome)").eq("grupo_id", grupoId);
    const mencionados = (membros ?? []).filter((m: any) => {
      const n = normalizar(m.usuarios?.nome ?? "");
      return m.usuario_id !== ator.id && tokens.some((t) => n.split(" ").some((p) => p.startsWith(t)) || n.replace(/\s/g, "").includes(t));
    }).map((m: any) => m.usuario_id);
    const uniq = [...new Set(mencionados)] as string[];
    if (uniq.length) {
      await admin.from("mensagem_mencoes").insert(uniq.map((id) => ({ mensagem_id: msg.id, usuario_id: id })));
      await notificarUsuarios(uniq, "mencao", `${ator.nome} mencionou você no Bate-papo`, `/app/conversas?grupo=${grupoId}`);
    }
  }
  revalidatePath("/app/conversas");
  return { ok: true };
}

export async function editarMensagem(id: string, conteudo: string) {
  const ator = await getAtor(); if (!ator) return { ok: false };
  const admin = createSupabaseAdmin();
  const { data: m } = await admin.from("mensagens").select("autor_id").eq("id", id).maybeSingle();
  if (!m || m.autor_id !== ator.id) return { ok: false, erro: "Só o autor edita." };
  await admin.from("mensagens").update({ conteudo: conteudo.trim(), editada: true }).eq("id", id);
  revalidatePath("/app/conversas"); return { ok: true };
}
export async function excluirMensagem(id: string) {
  const ator = await getAtor(); if (!ator) return { ok: false };
  const admin = createSupabaseAdmin();
  const { data: m } = await admin.from("mensagens").select("autor_id").eq("id", id).maybeSingle();
  const podeModerar = ["diretor", "coordenador", "administrador"].some((c) => ator.cargos.includes(c as any));
  if (!m || (m.autor_id !== ator.id && !podeModerar)) return { ok: false, erro: "Sem permissão." };
  await admin.from("mensagens").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/app/conversas"); return { ok: true };
}

// Garante os grupos iniciais + membros por cargo (idempotente; admin).
export async function garantirGruposIniciais() {
  const ator = await getAtor(); if (!ator) return;
  const podeAdmin = ["administrador", "diretor"].some((c) => ator.cargos.includes(c as any));
  if (!podeAdmin) return;
  const admin = createSupabaseAdmin();
  const { data: usuarios } = await admin.from("usuarios").select("id,ambiente_principal,situacao").eq("ambiente_principal", "interno").eq("situacao", "ativa");
  const { data: cargos } = await admin.from("usuario_cargos").select("usuario_id, cargos(chave)");
  const cargoDe = new Map<string, string[]>();
  for (const c of cargos ?? []) { const a = cargoDe.get(c.usuario_id) ?? []; a.push((c as any).cargos?.chave); cargoDe.set(c.usuario_id, a); }
  const internos = (usuarios ?? []).map((u: any) => u.id);
  const temCargo = (uid: string, chaves: string[]) => (cargoDe.get(uid) ?? []).some((c) => chaves.includes(c));
  const defs: { nome: string; descricao: string; membros: string[] }[] = [
    { nome: "GERAL", descricao: "Todos os internos", membros: internos },
    { nome: "CRIAÇÃO", descricao: "Equipe de criação", membros: internos.filter((u) => temCargo(u, ["designer", "coordenador", "social_media", "diretor", "administrador"])) },
    { nome: "AUDIOVISUAL", descricao: "Equipe de audiovisual", membros: internos.filter((u) => temCargo(u, ["videomaker", "coordenador", "social_media", "diretor", "administrador"])) },
  ];
  for (const d of defs) {
    let { data: g } = await admin.from("grupos_conversa").select("id").eq("nome", d.nome).maybeSingle();
    if (!g) { const { data: novo } = await admin.from("grupos_conversa").insert({ nome: d.nome, descricao: d.descricao }).select("id").single(); g = novo; }
    if (!g) continue;
    const { data: atuais } = await admin.from("grupo_membros").select("usuario_id").eq("grupo_id", g.id);
    const jah = new Set((atuais ?? []).map((m: any) => m.usuario_id));
    const novos = d.membros.filter((u) => !jah.has(u)).map((u) => ({ grupo_id: g!.id, usuario_id: u }));
    if (novos.length) await admin.from("grupo_membros").insert(novos);
  }
}
