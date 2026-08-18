"use server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { casa } from "@/domain/busca";

export type CategoriaBusca = "solicitacao" | "demanda" | "conteudo" | "comentario" | "link";
export type ResultadoBusca = {
  categoria: CategoriaBusca; id: string; protocolo: string | null; titulo: string;
  corpo: string; data: string | null; secretariaNome: string | null;
  status: string | null; prioridade: string | null; url: string;
};
export type FiltrosBusca = {
  secretariaId?: string; tipo?: string; status?: string; prioridade?: string;
  profissionalId?: string; de?: string; ate?: string;
};

const j = (...xs: (string | null | undefined)[]) => xs.filter(Boolean).join(" ");
const dentroPeriodo = (data: string | null | undefined, f: FiltrosBusca) =>
  (!f.de || (data ?? "") >= f.de) && (!f.ate || (data ?? "") <= f.ate + "T23:59:59");

// Busca global. Tenta a RPC busca_global (PATCH_0007); se ausente, usa fallback
// em JS sobre o schema atual — ambos 100% via cliente do usuario (RLS aplicada).
export async function buscaGlobal(termo: string, f: FiltrosBusca = {}): Promise<ResultadoBusca[]> {
  const q = (termo ?? "").trim();
  if (q.length < 2) return [];
  const sb = createSupabaseServer();
  const { data: secs } = await sb.from("secretarias").select("id,nome");
  const mSecNome = new Map<string, any>((secs ?? []).map((s: any) => [s.id, s.nome] as [string, any]));

  // 1) Caminho preferencial: RPC (rapida, acento-insensivel, protocolo de demanda).
  try {
    const { data, error } = await sb.rpc("busca_global", {
      termo: q, p_secretaria: f.secretariaId ?? null, p_tipo: f.tipo ?? null,
      p_status: f.status ?? null, p_prioridade: f.prioridade ?? null,
      p_profissional: f.profissionalId ?? null, p_de: f.de ?? null, p_ate: f.ate ? f.ate + "T23:59:59" : null,
    });
    if (!error && Array.isArray(data)) {
      return data.map((r: any) => ({
        categoria: r.categoria, id: r.id, protocolo: r.protocolo, titulo: r.titulo,
        corpo: r.corpo ?? "", data: r.data, secretariaNome: mSecNome.get(r.secretaria_id) ?? null,
        status: r.status, prioridade: r.prioridade, url: r.url,
      }));
    }
  } catch { /* RPC ausente -> fallback */ }

  // 2) Fallback (schema atual): busca em JS sobre linhas que a RLS permite ver.
  return fallback(sb, q, f, mSecNome);
}

async function fallback(sb: any, q: string, f: FiltrosBusca, mSecNome: Map<any, any>): Promise<ResultadoBusca[]> {
  const [{ data: sols }, { data: subs }, { data: dems }, { data: coments }, { data: links }, { data: unis }, { data: users }, { data: mem }] =
    await Promise.all([
      sb.from("solicitacoes").select("id,protocolo,titulo,descricao,briefing_interno,tipo,secretaria_id,unidade_id,criado_por,status_externo,prazo_desejado,created_at").is("deleted_at", null).limit(2000),
      sb.from("subdemandas").select("id,demanda_id,titulo,area,resumo,observacoes,conteudo,tipo,etapa,macroetapa,prioridade,prazo,responsavel_id,secretaria_id,updated_at,created_at").is("deleted_at", null).limit(2000),
      sb.from("demandas").select("id,titulo,descricao,briefing_consolidado,solicitacao_id,secretaria_id,unidade_id").is("deleted_at", null).limit(2000),
      sb.from("comentarios").select("id,subdemanda_id,autor_id,conteudo,created_at").is("deleted_at", null).limit(2000),
      sb.from("links_drive").select("id,subdemanda_id,titulo,descricao,url,tipo,created_at").is("deleted_at", null).limit(2000),
      sb.from("unidades").select("id,nome"),
      sb.from("usuarios").select("id,nome"),
      sb.from("subdemanda_membros").select("subdemanda_id,usuario_id"),
    ]);

  const mUni = new Map<string, any>((unis ?? []).map((u: any) => [u.id, u.nome] as [string, any]));
  const mUser = new Map<string, any>((users ?? []).map((u: any) => [u.id, u.nome] as [string, any]));
  const mDem = new Map<string, any>((dems ?? []).map((d: any) => [d.id, d] as [string, any]));
  const mSol = new Map<string, any>((sols ?? []).map((s: any) => [s.id, s] as [string, any]));
  const mSub = new Map<string, any>((subs ?? []).map((s: any) => [s.id, s] as [string, any]));
  const membrosNomes = new Map<string, string[]>();
  const membrosIds = new Map<string, string[]>();
  for (const m of mem ?? []) {
    const nomes = membrosNomes.get(m.subdemanda_id) ?? [];
    nomes.push(mUser.get(m.usuario_id) ?? ""); membrosNomes.set(m.subdemanda_id, nomes);
    const ids = membrosIds.get(m.subdemanda_id) ?? [];
    ids.push(m.usuario_id); membrosIds.set(m.subdemanda_id, ids);
  }

  const okFiltroSub = (sub: any) =>
    (!f.secretariaId || sub.secretaria_id === f.secretariaId) &&
    (!f.tipo || sub.tipo === f.tipo) &&
    (!f.status || sub.etapa === f.status) &&
    (!f.prioridade || sub.prioridade === f.prioridade) &&
    (!f.profissionalId || sub.responsavel_id === f.profissionalId || (membrosIds.get(sub.id) ?? []).includes(f.profissionalId));

  const dadosSub = (sub: any) => {
    const dem = mDem.get(sub.demanda_id); const sol = dem?.solicitacao_id ? mSol.get(dem.solicitacao_id) : null;
    return { dem, protocolo: sol?.protocolo ?? null, secNome: mSecNome.get(sub.secretaria_id ?? dem?.secretaria_id) ?? null };
  };

  const out: ResultadoBusca[] = [];

  for (const s of sols ?? []) {
    if (f.secretariaId && s.secretaria_id !== f.secretariaId) continue;
    if (f.tipo && s.tipo !== f.tipo) continue;
    if (f.status && s.status_externo !== f.status) continue;
    if (f.prioridade || f.profissionalId) continue; // nao se aplica a solicitacao
    if (!dentroPeriodo(s.created_at, f)) continue;
    const hay = j(s.protocolo, s.titulo, s.descricao, s.briefing_interno, mSecNome.get(s.secretaria_id), mUni.get(s.unidade_id), mUser.get(s.criado_por));
    if (!casa(hay, q)) continue;
    out.push({ categoria: "solicitacao", id: s.id, protocolo: s.protocolo, titulo: s.titulo,
      corpo: j(s.descricao, s.briefing_interno), data: s.created_at, secretariaNome: mSecNome.get(s.secretaria_id) ?? null,
      status: s.status_externo, prioridade: null, url: `/app/solicitacoes/${s.id}` });
  }

  for (const sub of subs ?? []) {
    if (!okFiltroSub(sub)) continue;
    if (!dentroPeriodo(sub.updated_at ?? sub.created_at, f)) continue;
    const { dem, protocolo, secNome } = dadosSub(sub);
    const nomes = j(secNome, mUni.get(dem?.unidade_id), mUser.get(sub.responsavel_id), (membrosNomes.get(sub.id) ?? []).join(" "));
    const hayDem = j(sub.titulo, sub.area, sub.resumo, sub.observacoes, dem?.titulo, dem?.descricao, dem?.briefing_consolidado, protocolo, nomes);
    if (casa(hayDem, q)) out.push({ categoria: "demanda", id: sub.id, protocolo, titulo: sub.titulo,
      corpo: j(sub.resumo, sub.observacoes, sub.area, dem?.descricao), data: sub.updated_at ?? sub.created_at,
      secretariaNome: secNome, status: sub.etapa, prioridade: sub.prioridade, url: `/app/demandas/${sub.id}` });
    const conteudoStr = sub.conteudo && Object.keys(sub.conteudo).length ? JSON.stringify(sub.conteudo) : "";
    if (conteudoStr && casa(conteudoStr, q)) out.push({ categoria: "conteudo", id: sub.id, protocolo, titulo: sub.titulo,
      corpo: valoresJson(sub.conteudo), data: sub.updated_at ?? sub.created_at, secretariaNome: secNome,
      status: sub.etapa, prioridade: sub.prioridade, url: `/app/demandas/${sub.id}` });
  }

  for (const c of coments ?? []) {
    const sub = mSub.get(c.subdemanda_id); if (!sub || !okFiltroSub(sub)) continue;
    if (!dentroPeriodo(c.created_at, f)) continue;
    const { protocolo, secNome } = dadosSub(sub);
    if (!casa(j(c.conteudo, mUser.get(c.autor_id)), q)) continue;
    out.push({ categoria: "comentario", id: c.id, protocolo, titulo: sub.titulo, corpo: c.conteudo,
      data: c.created_at, secretariaNome: secNome, status: sub.etapa, prioridade: sub.prioridade, url: `/app/demandas/${sub.id}` });
  }

  for (const l of links ?? []) {
    const sub = mSub.get(l.subdemanda_id); if (!sub || !okFiltroSub(sub)) continue;
    if (!dentroPeriodo(l.created_at, f)) continue;
    const { protocolo, secNome } = dadosSub(sub);
    if (!casa(j(l.titulo, l.descricao, l.url, l.tipo), q)) continue;
    out.push({ categoria: "link", id: l.id, protocolo, titulo: l.titulo || l.tipo || "Link", corpo: j(l.descricao, l.url),
      data: l.created_at, secretariaNome: secNome, status: sub.etapa, prioridade: sub.prioridade, url: `/app/demandas/${sub.id}` });
  }

  out.sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
  return out.slice(0, 300);
}

function valoresJson(o: any): string {
  if (!o || typeof o !== "object") return "";
  const acc: string[] = [];
  for (const v of Object.values(o)) {
    if (typeof v === "string") acc.push(v);
    else if (Array.isArray(v)) acc.push(v.filter((x) => typeof x === "string").join(" "));
    else if (v && typeof v === "object") acc.push(valoresJson(v));
  }
  return acc.join(" · ");
}
