"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { salvarBriefingInterno, triagem, aprovarParaPlanejamento, enviarMensagemSolic } from "@/server/data/solicitacoes";
import { BackButton, Breadcrumb } from "@/components/interno/BackButton";

const ABAS = ["Resumo", "Demanda", "Briefing original", "Briefing interno", "Mensagens", "Histórico"] as const;
const dt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

export function TriagemDetalhe({ s, internos, podeInterna, podeAprovar, ambienteAtor }:
  { s: any; internos: { id: string; nome: string; funcao: string; cargoChave: string | null }[]; podeInterna: boolean; podeAprovar: boolean; ambienteAtor: string }) {
  const router = useRouter();
  const [aba, setAba] = useState<typeof ABAS[number]>("Resumo");
  const [brief, setBrief] = useState<string>(s.briefing_interno ?? "");
  const [dados, setDados] = useState({ tipo: s.tipo ?? "digital", area: "", prazo: s.prazo_desejado ? String(s.prazo_desejado).slice(0, 16) : "", prioridade: "media", responsavelId: "", aguardandoDistribuicao: false });
  const [membros, setMembros] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null); const [pend, setPend] = useState<string[]>([]);
  const [msgTexto, setMsgTexto] = useState(""); const [interna, setInterna] = useState(false);
  const [pending, start] = useTransition();
  const set = (k: string, v: any) => setDados((d) => ({ ...d, [k]: v }));
  const finalizada = ["aprovada_planejamento", "recusada", "cancelada"].includes(s.status_externo);

  function salvarBrief() { start(async () => { const r = await salvarBriefingInterno(s.id, brief); setMsg(r.ok ? "Briefing interno salvo." : (r.erro ?? "Erro")); router.refresh(); }); }
  function acaoSimples(a: "iniciar_analise" | "pedir_info" | "recusar" | "cancelar") {
    let justificativa: string | undefined;
    if (a === "recusar" || a === "cancelar") { const j = prompt(`Justificativa para ${a}:`); if (j === null) return; justificativa = j; }
    start(async () => { const r = await triagem(s.id, a, { justificativa }); setMsg(r.ok ? "Feito." : (r.erro ?? "Erro")); router.refresh(); });
  }
  function aprovar() {
    setPend([]); start(async () => {
      const r = await aprovarParaPlanejamento(s.id, { tipo: dados.tipo, area: dados.area, prazo: dados.prazo || undefined, prioridade: dados.prioridade, membros });
      if (!r.ok) { setMsg(r.erro ?? "Erro"); return; }
      window.location.href = "/app/planejamento";
    });
  }
  function enviarMsg() {
    if (!msgTexto.trim()) return;
    start(async () => {
      const r = await enviarMensagemSolic(s.id, msgTexto, interna ? "interna" : "publica");
      if (r.ok) { setMsgTexto(""); router.refresh(); } else setMsg(r.erro ?? "Erro ao enviar.");
    });
  }

  const mensagens = (s.mensagens ?? []) as any[];

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 flex-wrap"><BackButton fallback="/app/solicitacoes" /><Breadcrumb trilha={[{ nome: "Solicitações", href: "/app/solicitacoes" }, { nome: s.protocolo }]} /></div>
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className="text-[11px] bg-neutro-surface2 border border-neutro-border rounded px-2 py-0.5">{s.protocolo}</span>
        <span className="text-[12px] text-neutro-text2">{s.secretariaNome} · {s.setorNome} · {s.solicitanteNome}</span>
      </div>
      <h1 className="text-[22px] font-bold">{s.titulo}</h1>
      <p className="text-neutro-text2 text-[13px] mb-3">Chegada {dt(s.created_at)} · Status: {s.status_externo}</p>

      {!finalizada && podeAprovar && (
        <div className="sticky top-0 z-30 -mx-6 px-6 py-2.5 mb-3 bg-white/90 backdrop-blur border-y border-neutro-border flex items-center gap-3 flex-wrap">
          <span className="text-[13px] text-neutro-text2 flex-1 min-w-[180px]">Confira o briefing e os dados da aba <b>Demanda</b> e aprove para o planejamento.</span>
          <Button variant="primary" disabled={pending} onClick={aprovar}>Aprovar para Planejamento</Button>
        </div>
      )}

      <div className="flex gap-1 border-b border-neutro-border mb-4 overflow-x-auto" role="tablist">
        {ABAS.map((a) => (
          <button key={a} role="tab" aria-selected={aba === a} onClick={() => setAba(a)}
            className={`px-3 py-2.5 text-[13px] font-semibold border-b-2 whitespace-nowrap transition-colors ${aba === a ? "text-marca-azul border-marca-azul" : "text-neutro-text2 border-transparent hover:text-neutro-text"}`}>{a}</button>
        ))}
      </div>
      {msg && <div role="status" className="tone-azul rounded-[10px] px-3 py-2 text-sm mb-3">{msg}</div>}
      {pend.length > 0 && <div role="alert" className="tone-vermelho rounded-[10px] px-3 py-2 text-sm mb-3"><b>Pendências:</b> {pend.join(" · ")}</div>}

      {aba === "Resumo" && <div className="card card-pad max-w-[620px] anim-in">
        <Kv k="Protocolo" v={s.protocolo} /><Kv k="Título" v={s.titulo} />
        <Kv k="Chegada" v={dt(s.created_at)} /><Kv k="Prazo desejado" v={s.prazo_desejado ? dt(s.prazo_desejado) : "—"} />
        <Kv k="Secretaria" v={s.secretariaNome} /><Kv k="Setor" v={s.setorNome} /><Kv k="Solicitante" v={s.solicitanteNome} />
        <Kv k="Status" v={s.status_externo} /><Kv k="Restrita" v={s.restrita ? "Sim" : "Não"} />
      </div>}

      {aba === "Demanda" && <div className="max-w-[620px] anim-in">
        <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Campo label="Tipo da demanda"><select className="inp" value={dados.tipo} onChange={(e) => set("tipo", e.target.value)}><option value="digital">Digital</option><option value="audiovisual">Audiovisual</option><option value="impresso">Impresso</option></select></Campo>
          <Campo label="Área / fluxo"><input className="inp" value={dados.area} onChange={(e) => set("area", e.target.value)} placeholder="Ex.: Redes sociais" /></Campo>
          <Campo label="Prazo interno"><input type="datetime-local" className="inp" value={dados.prazo} onChange={(e) => set("prazo", e.target.value)} /></Campo>
          <Campo label="Prioridade"><select className="inp" value={dados.prioridade} onChange={(e) => set("prioridade", e.target.value)}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="emergencial">Emergencial</option></select></Campo>
        </div>
        <Campo label="Responsável principal">
          <select className="inp" value={dados.responsavelId} onChange={(e) => set("responsavelId", e.target.value)} disabled={dados.aguardandoDistribuicao}>
            <option value="">— selecionar —</option>{internos.map((u) => <option key={u.id} value={u.id}>{u.nome} ({u.funcao})</option>)}
          </select>
        </Campo>
        <label className="flex items-center gap-2 text-[13px] mb-2"><input type="checkbox" checked={dados.aguardandoDistribuicao} onChange={(e) => set("aguardandoDistribuicao", e.target.checked)} /> Deixar aguardando distribuição (sem responsável agora)</label>
        <Campo label="Colaboradores">
          <div className="flex flex-wrap gap-1.5">{internos.map((u) => {
            const on = membros.includes(u.id);
            return <button key={u.id} type="button" onClick={() => setMembros((m) => on ? m.filter((x) => x !== u.id) : [...m, u.id])}
              className={`text-[12px] px-2 py-1 rounded-full border pressable ${on ? "bg-[#E7F3FF] border-marca-azul text-marca-azul" : "border-neutro-border text-neutro-text2"}`}>{u.nome}</button>;
          })}</div>
        </Campo>
      </div>}

      {aba === "Briefing original" && <div className="max-w-[720px] anim-in">
        <div className="tone-amarelo rounded-[10px] px-3 py-2 text-[13px] mb-2">Somente leitura. Preservado integralmente como enviado pelo solicitante.</div>
        <div className="card card-pad whitespace-pre-wrap text-[14px]">{s.descricao?.trim() ? s.descricao : "(sem briefing enviado)"}</div>
      </div>}

      {aba === "Briefing interno" && <div className="max-w-[720px] anim-in">
        <div className="tone-azul rounded-[10px] px-3 py-2 text-[13px] mb-2">Editável por Coordenador/Diretor. Vira a orientação oficial e é copiado para a demanda ao aprovar. Alterações ficam no histórico.</div>
        <textarea value={brief} onChange={(e) => setBrief(e.target.value)} disabled={finalizada} aria-label="Briefing interno" className="inp" style={{ minHeight: 200 }}
          placeholder="Consolide o briefing: objetivo, público, orientações internas, correções…" />
        {!finalizada && <div className="mt-2"><Button variant="primary" disabled={pending} onClick={salvarBrief}>Salvar briefing interno</Button></div>}
      </div>}

      {aba === "Mensagens" && <div className="max-w-[680px] anim-in">
        <p className="text-[12px] text-neutro-text3 mb-2">Canal com o solicitante durante toda a vida da solicitação. Comentários internos ficam visíveis apenas à equipe.</p>
        <div className="flex flex-col gap-2 mb-4">
          {mensagens.length === 0 && <p className="text-neutro-text2 text-[13px]">Sem mensagens ainda.</p>}
          {mensagens.map((m) => {
            const ehInterna = m.visibilidade === "interna";
            return (
              <div key={m.id} className={`rounded-[12px] px-3 py-2 ${ehInterna ? "tone-amarelo" : "bg-neutro-surface2"}`}>
                <div className="flex items-center gap-2 text-[11px] text-neutro-text2 mb-0.5">
                  <span className="font-semibold">{m.origem === "solicitante" ? "Solicitante" : "Equipe"}</span>
                  <span className={`px-1.5 rounded ${ehInterna ? "bg-[#8A6A00] text-white" : "bg-white border border-neutro-border"}`}>{ehInterna ? "🔒 interno" : "público"}</span>
                  <span className="ml-auto">{dt(m.created_at)}</span>
                </div>
                <div className="text-[13.5px] whitespace-pre-wrap">{m.conteudo}</div>
              </div>
            );
          })}
        </div>
        <div className="card card-pad">
          <textarea value={msgTexto} onChange={(e) => setMsgTexto(e.target.value)} aria-label="Nova mensagem" placeholder={interna ? "Comentário interno (não visível ao solicitante)…" : "Mensagem ao solicitante…"} className="inp" style={{ minHeight: 72 }} />
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {podeInterna && (
              <label className="flex items-center gap-2 text-[13px]">
                <input type="checkbox" checked={interna} onChange={(e) => setInterna(e.target.checked)} /> Comentário interno
              </label>
            )}
            <div className="flex-1" />
            <Button variant="primary" disabled={pending} onClick={enviarMsg}>{interna ? "Enviar interno" : "Enviar"}</Button>
          </div>
        </div>
      </div>}

      {aba === "Histórico" && <div className="max-w-[620px] anim-in">
        {(s.historico ?? []).map((h: any, i: number) => <div key={i} className="flex gap-3 py-2.5 border-b border-dashed border-neutro-border"><span className="text-marca-azul">●</span><div><div className="text-[13.5px]">{rotuloAcao(h.acao)}{h.justificativa ? ` — ${h.justificativa}` : ""}</div><div className="text-[12px] text-neutro-text2">{dt(h.created_at)}</div></div></div>)}
        {(s.historico ?? []).length === 0 && <p className="text-neutro-text2 text-[13px]">Sem registros.</p>}
      </div>}

      {!finalizada && (
        <div className="flex gap-2 flex-wrap mt-5 pt-4 border-t border-neutro-border">
          <Button disabled={pending} onClick={() => acaoSimples("iniciar_analise")}>Iniciar análise</Button>
          <Button disabled={pending} onClick={() => acaoSimples("pedir_info")}>Solicitar informações</Button>
          <Button variant="danger" disabled={pending} onClick={() => acaoSimples("recusar")}>Recusar</Button>
          <Button variant="danger" disabled={pending} onClick={() => acaoSimples("cancelar")}>Cancelar</Button>
        </div>
      )}
      {finalizada && s.demandaId && <div className="mt-5"><a href={`/app/demandas/${s.demandaId}`} className="font-semibold">Abrir demanda gerada →</a></div>}
    </div>
  );
}
const ACOES: Record<string, string> = {
  triagem_iniciar_analise: "Início da análise", triagem_pedir_info: "Pedido de informações",
  triagem_recusar: "Solicitação recusada", triagem_cancelar: "Solicitação cancelada",
  triagem_ajustar_prazo: "Prazo ajustado", aprovada_convertida: "Aprovada e transformada em demanda",
  briefing_interno_editado: "Briefing interno editado",
};
function rotuloAcao(a: string) { return ACOES[a] ?? a; }
function Kv({ k, v }: { k: string; v: any }) { return <div className="flex gap-2 py-2 border-b border-dashed border-neutro-border text-[13px]"><div className="w-40 text-neutro-text2">{k}</div><div className="font-medium">{String(v)}</div></div>; }
function Campo({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block mb-3"><span className="block text-[13px] font-semibold mb-1.5">{label}</span>{children}</label>; }
