import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServer } from "@/lib/supabase-server";

// Insere notificações internas para os destinatários (exceto o próprio autor).
export async function notificarUsuarios(destinatarios: string[], tipo: string, titulo: string, refUrl?: string) {
  const ids = [...new Set(destinatarios.filter(Boolean))];
  if (!ids.length) return;
  const admin = createSupabaseAdmin();
  await admin.from("notificacoes").insert(ids.map((id) => ({ destinatario_id: id, canal: "interno", tipo, titulo, referencia_url: refUrl ?? null, lida: false })));
}

// Notifica os ENVOLVIDOS numa subdemanda (responsável + membros), exceto o autor da ação.
export async function notificarEnvolvidos(subId: string, exceto: string | null, tipo: string, titulo: string, refUrl?: string) {
  const sb = createSupabaseServer();
  const { data: s } = await sb.from("subdemandas").select("responsavel_id").eq("id", subId).maybeSingle();
  const { data: mem } = await sb.from("subdemanda_membros").select("usuario_id").eq("subdemanda_id", subId);
  const ids = [...(s?.responsavel_id ? [s.responsavel_id] : []), ...(mem ?? []).map((m: any) => m.usuario_id)].filter((id) => id !== exceto);
  await notificarUsuarios(ids, tipo, titulo, refUrl ?? `/app/demandas/${subId}`);
}
