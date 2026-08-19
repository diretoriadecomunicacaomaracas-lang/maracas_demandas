"use client";
import { useState, useTransition } from "react";
import { BackButton, Breadcrumb } from "@/components/interno/BackButton";
import { Button } from "@/components/ui/Button";
import { StatusChip, AtrasoChip } from "@/components/ui/StatusChip";
import { PriorityChip } from "@/components/ui/Priority";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { atrasoDias } from "@/domain/rules";
import { editarGerencial, editarOperacional, atribuirResponsavel, adicionarMembro, removerMembro, finalizarDemanda } from "@/server/data/demandas";
import { aprovarDigital, liberarPublicacao, aprovarImpresso, liberarImpressao } from "@/server/data/aprovacoes";
import { ConteudoSection } from "./ConteudoSection";
import { LinksSection } from "./LinksSection";
import { ChecklistSection } from "./ChecklistSection";
import { ComentariosSection } from "./ComentariosSection";
import { ExcluirDemanda } from "@/components/interno/ExcluirDemanda";
import { IniciarProducaoBtn } from "@/components/interno/IniciarProducaoBtn";
import { useDirtyGuard } from "./useDirty";

const dt = (iso?: string | null) => iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";
const dtd = (iso?: string | null) => iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";

export function PaginaTarefa({ sub, versoes, aprovacoes, pedido, historico, links, checklist, comentarios, internos, meId, perms }: any) {
  const ABAS = ["Visão geral", "Briefing", "Roteiro e conteúdo", "Datas e agenda", "Responsáveis", "Links e referências", "Versões e aprovações", "Checklist", "Comentários", "Histórico"];
  const [aba, setAba] = useState(ABAS[0]);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const vigente = versoes.find((v: any) => v.vigente) ?? versoes[versoes.length - 1];
  const impresso = sub.tipo === "impresso";
  const dias = atrasoDias(sub.prazo, sub.macroetapa);
  const equipe = [...(sub.responsavel ? [sub.responsavel] : []), ...sub.membros];
  function run(fn: () => Promise<any>) { start(async () => { const r = await fn(); setMsg(r?.ok ? "Feito." : (r?.pendencias?.join(" · ") ?? r?.erro ?? "Erro")); }); }

  // Visão geral editável (gerencial)
  const [editVG, setEditVG] = useState(false);
  const [vg, setVg] = useState({ titulo: sub.titulo ?? "", area: sub.area ?? "", prioridade: sub.prioridade ?? "media", prazo: sub.prazo ? String(sub.prazo).slice(0, 16) : "", tipo: sub.tipo });
  const dirtyVG = editVG && JSON.stringify(vg) !== JSON.stringify({ titulo: sub.titulo ?? "", area: sub.area ?? "", prioridade: sub.prioridade ?? "media", prazo: sub.prazo ? String(sub.prazo).slice(0, 16) : "", tipo: sub.tipo });
  useDirtyGuard(dirtyVG);
  function salvarVG() { start(async () => { const r = await editarGerencial(sub.id, { ...vg, prazo: vg.prazo || null }); setMsg(r.ok ? "Dados salvos." : (r.erro ?? "Erro")); if (r.ok) setEditVG(false); }); }

  // Briefing interno editável (gerencial)
  const [briefInt, setBriefInt] = useState(sub.briefingConsolidado ?? "");
  const [editBrief, setEditBrief] = useState(false);
  function salvarBrief() { start(async () => { const r = await editarGerencial(sub.id, { briefing_interno: briefInt }); setMsg(r.ok ? "Briefing salvo." : (r.erro ?? "Erro")); if (r.ok) setEditBrief(false); }); }

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <BackButton fallback="/app/demandas" />
        <Breadcrumb trilha={[{ nome: "Demandas", href: "/app/demandas" }, { nome: sub.protocolo ? `Demanda ${sub.protocolo}` : sub.titulo }]} />
        <div className="flex-1" />
        <IniciarProducaoBtn subId={sub.id} etapa={sub.etapa} tipo={sub.tipo} temResponsavel={!!sub.responsavel} />
        <ExcluirDemanda subId={sub.id} pode={!!perms.podeExcluir} />
      </div>

      {/* Cabeçalho da tarefa */}
      <div className="bg-white border border-neutro-border rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {sub.protocolo && <span className="text-[11px] bg-neutro-surface2 border border-neutro-border rounded px-2 py-0.5">{sub.protocolo}</span>}
          <span className="text-[11px] bg-neutro-surface2 border border-neutro-border rounded px-2 py-0.5 capitalize">{sub.tipo}</span>
          <StatusChip status={sub.etapa} /> {dias > 0 && <AtrasoChip dias={dias} />}
          <PriorityChip prioridade={sub.prioridade} />
        </div>
        <h1 className="text-[22px] font-bold">{sub.titulo}</h1>
        <div className="flex items-center gap-4 flex-wrap text-[13px] text-neutro-text2 mt-2">
          <span>{sub.secretariaNome} · {sub.setorNome}</span>
          <span>Prazo: {dtd(sub.prazo)}</span>
          <span>Versão vigente: {vigente ? `V${vigente.numero}` : "—"}</span>
          <span className="inline-flex items-center gap-1">Equipe: {equipe.length ? <AvatarStack pessoas={equipe} max={5} /> : "—"}</span>
          <span>Criada: {dtd(sub.created_at)}</span>
          <span>Atualizada: {dt(sub.updated_at)}</span>
        </div>
        {perms.podeDistribuir && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button className="h-8 px-3 text-[13px]" disabled={pending} onClick={() => { if (confirm("Finalizar esta demanda?")) run(() => finalizarDemanda(sub.id)); }}>Finalizar demanda</Button>
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-neutro-border mb-4 overflow-x-auto">
        {ABAS.filter((a) => a !== "Roteiro e conteúdo" || true).map((a) => (
          <button key={a} onClick={() => setAba(a)} className={`px-3 py-2.5 text-[13px] font-semibold border-b-2 whitespace-nowrap ${aba === a ? "text-marca-azul border-marca-azul" : "text-neutro-text2 border-transparent"}`}>{a}</button>
        ))}
      </div>
      {msg && <div role="status" className="tone-azul rounded-[10px] px-3 py-2 text-sm mb-3">{msg}</div>}

      {aba === "Visão geral" && (
        <div className="max-w-[620px]">
          <div className="flex items-center justify-between mb-2"><h3 className="text-[15px] font-bold">Visão geral</h3>{perms.podeDistribuir && !editVG && <Button className="h-8 px-3 text-[13px]" onClick={() => setEditVG(true)}>Editar</Button>}</div>
          <div className="bg-white border border-neutro-border rounded-xl p-4">
            {!editVG ? (<>
              <Kv k="Título" v={sub.titulo} /><Kv k="Resumo" v={sub.resumo ?? "—"} /><Kv k="Secretaria" v={sub.secretariaNome} /><Kv k="Setor" v={sub.setorNome} />
              <Kv k="Tipo" v={sub.tipo} /><Kv k="Área/fluxo" v={sub.area ?? "—"} /><Kv k="Etapa" v={sub.etapa} /><Kv k="Prioridade" v={<PriorityChip prioridade={sub.prioridade} />} /><Kv k="Prazo" v={dtd(sub.prazo)} />
            </>) : (<div className="flex flex-col gap-3">
              <L label="Título"><input className="inp" value={vg.titulo} onChange={(e) => setVg((v) => ({ ...v, titulo: e.target.value }))} /></L>
              <L label="Tipo"><select className="inp" value={vg.tipo} onChange={(e) => setVg((v) => ({ ...v, tipo: e.target.value }))}><option value="digital">Digital</option><option value="audiovisual">Audiovisual</option><option value="impresso">Impresso</option></select></L>
              <L label="Área/fluxo"><input className="inp" value={vg.area} onChange={(e) => setVg((v) => ({ ...v, area: e.target.value }))} /></L>
              <L label="Prioridade"><select className="inp" value={vg.prioridade} onChange={(e) => setVg((v) => ({ ...v, prioridade: e.target.value }))}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="emergencial">Emergencial</option></select></L>
              <L label="Prazo"><input type="datetime-local" className="inp" value={vg.prazo} onChange={(e) => setVg((v) => ({ ...v, prazo: e.target.value }))} /></L>
              <div className="flex gap-2"><Button variant="primary" disabled={pending} onClick={salvarVG}>{pending ? "Salvando…" : "Salvar alterações"}</Button><Button disabled={pending} onClick={() => { if (!dirtyVG || confirm("Descartar alterações?")) setEditVG(false); }}>Cancelar</Button>{dirtyVG && <span className="text-[12px] text-[#8A6A00] self-center">Não salvo</span>}</div>
            </div>)}
          </div>
          {/* Resumo operacional editável */}
          {perms.podeOperacional && <ResumoOperacional subId={sub.id} resumo={sub.resumo ?? ""} observacoes={sub.observacoes ?? ""} />}
          {/* Subdemandas irmãs */}
          {sub.irmas?.length > 0 && (
            <div className="mt-4"><h3 className="text-[15px] font-bold mb-2">Subdemandas da campanha</h3>
              <div className="bg-white border border-neutro-border rounded-xl divide-y divide-neutro-border">
                {sub.irmas.map((i: any) => <a key={i.id} href={`/app/demandas/${i.id}`} className="p-3 flex items-center gap-2 hover:bg-neutro-surface2"><span className="text-[11px] bg-neutro-surface2 border border-neutro-border rounded px-2 py-0.5 capitalize">{i.tipo}</span><span className="flex-1 font-semibold">{i.titulo}</span><StatusChip status={i.etapa} /></a>)}
              </div>
            </div>
          )}
        </div>
      )}

      {aba === "Briefing" && (
        <div className="max-w-[720px]">
          <div className="tone-amarelo rounded-[10px] px-3 py-2 text-[13px] mb-2">Briefing original do solicitante — <b>somente leitura</b>, preservado.</div>
          <div className="bg-white border border-neutro-border rounded-xl p-4 whitespace-pre-wrap text-[14px] mb-4">{sub.briefingOriginal?.trim() ? sub.briefingOriginal : "(sem briefing enviado)"}</div>
          <div className="flex items-center justify-between mb-2"><h3 className="text-[15px] font-bold">Briefing interno consolidado</h3>{perms.podeDistribuir && !editBrief && <Button className="h-8 px-3 text-[13px]" onClick={() => setEditBrief(true)}>Editar</Button>}</div>
          {!editBrief ? <div className="bg-white border border-neutro-border rounded-xl p-4 whitespace-pre-wrap text-[14px]">{briefInt?.trim() ? briefInt : "—"}</div>
            : <><textarea className="w-full border border-neutro-border rounded-[10px] p-3 outline-none focus:border-marca-azul" style={{ minHeight: 160 }} value={briefInt} onChange={(e) => setBriefInt(e.target.value)} />
              <div className="flex gap-2 mt-2"><Button variant="primary" disabled={pending} onClick={salvarBrief}>Salvar</Button><Button disabled={pending} onClick={() => setEditBrief(false)}>Cancelar</Button></div></>}
        </div>
      )}

      {aba === "Roteiro e conteúdo" && <ConteudoSection subId={sub.id} tipo={sub.tipo} conteudo={sub.conteudo ?? {}} podeEditar={perms.podeOperacional && !perms.readonly} />}

      {aba === "Datas e agenda" && (
        <div className="max-w-[560px] bg-white border border-neutro-border rounded-xl p-4">
          <Kv k="Prazo interno" v={dt(sub.prazo)} /><Kv k="Data de publicação" v={dt(sub.data_publicacao)} />
          <div className="text-[12px] text-neutro-text2 mt-2">Datas específicas de gravação/entrega estão na aba “Roteiro e conteúdo”, conforme o tipo. Todas no fuso America/Sao_Paulo (DD/MM/AAAA, 24h).</div>
        </div>
      )}

      {aba === "Responsáveis" && <ResponsaveisSection sub={sub} internos={internos} podeDistribuir={perms.podeDistribuir} pending={pending} run={run} />}

      {aba === "Links e referências" && <LinksSection subId={sub.id} links={links} podeEditar={perms.podeOperacional && !perms.readonly} />}

      {aba === "Versões e aprovações" && <VersoesAprovacoes sub={sub} versoes={versoes} vigente={vigente} impresso={impresso} pedido={pedido} perms={perms} pending={pending} run={run} />}

      {aba === "Checklist" && <ChecklistSection subId={sub.id} itens={checklist} podeEditar={perms.podeOperacional && !perms.readonly} />}

      {aba === "Comentários" && <ComentariosSection subId={sub.id} comentarios={comentarios} internos={internos} meId={meId} />}

      {aba === "Histórico" && (
        <div className="max-w-[680px]">
          {historico.map((h: any, i: number) => <div key={i} className="flex gap-3 py-2.5 border-b border-dashed border-neutro-border"><span className="text-marca-azul">●</span><div><div className="text-[13.5px]">{h.acao}{h.justificativa ? ` — ${h.justificativa}` : ""}</div><div className="text-[12px] text-neutro-text2">{dt(h.created_at)}</div></div></div>)}
          {historico.length === 0 && <p className="text-neutro-text2 text-[13px]">Sem registros.</p>}
        </div>
      )}
      <style>{`.inp{width:100%;height:40px;border:1px solid var(--border);border-radius:10px;padding:0 12px;outline:none}.inp:focus{border-color:var(--azul)}`}</style>
    </div>
  );
}

function Kv({ k, v }: { k: string; v: any }) { return <div className="flex gap-2 py-2 border-b border-dashed border-neutro-border text-[13px]"><div className="w-40 text-neutro-text2">{k}</div><div className="font-medium">{typeof v === "string" || typeof v === "number" ? v : v}</div></div>; }
function L({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="block text-[12px] font-semibold text-neutro-text2 mb-1">{label}</span>{children}</label>; }

function ResumoOperacional({ subId, resumo, observacoes }: { subId: string; resumo: string; observacoes: string }) {
  const [r, setR] = useState(resumo); const [o, setO] = useState(observacoes); const [edit, setEdit] = useState(false);
  const [pending, start] = useTransition(); const [msg, setMsg] = useState<string | null>(null);
  const dirty = edit && (r !== resumo || o !== observacoes);
  useDirtyGuard(dirty);
  function salvar() { start(async () => { const res = await editarOperacional(subId, { resumo: r, observacoes: o }); setMsg(res.ok ? "Salvo." : (res.erro ?? "Erro")); if (res.ok) setEdit(false); }); }
  return (
    <div className="bg-white border border-neutro-border rounded-xl p-4 mt-3">
      <div className="flex items-center justify-between mb-2"><div className="text-[12px] uppercase text-neutro-text2 font-bold">Resumo e observações (operacional)</div>{!edit && <Button className="h-8 px-3 text-[13px]" onClick={() => setEdit(true)}>Editar</Button>}</div>
      {msg && <div role="status" className="tone-azul rounded-[10px] px-3 py-2 text-sm mb-2">{msg}</div>}
      {!edit ? (<>
        <div className="text-[13px] mb-1"><b>Resumo:</b> {resumo || "—"}</div>
        <div className="text-[13px]"><b>Observações:</b> {observacoes || "—"}</div>
      </>) : (<div className="flex flex-col gap-2">
        <textarea className="w-full border border-neutro-border rounded-[10px] p-2" style={{ minHeight: 60 }} placeholder="Resumo" value={r} onChange={(e) => setR(e.target.value)} />
        <textarea className="w-full border border-neutro-border rounded-[10px] p-2" style={{ minHeight: 60 }} placeholder="Observações internas" value={o} onChange={(e) => setO(e.target.value)} />
        <div className="flex gap-2"><Button variant="primary" disabled={pending} onClick={salvar}>Salvar</Button><Button disabled={pending} onClick={() => { if (!dirty || confirm("Descartar?")) { setR(resumo); setO(observacoes); setEdit(false); } }}>Cancelar</Button>{dirty && <span className="text-[12px] text-[#8A6A00] self-center">Não salvo</span>}</div>
      </div>)}
    </div>
  );
}

function ResponsaveisSection({ sub, internos, podeDistribuir, pending, run }: any) {
  return (
    <div className="max-w-[620px]">
      <div className="bg-white border border-neutro-border rounded-xl p-4 mb-3">
        <div className="text-[12px] uppercase text-neutro-text2 font-bold mb-2">Responsável principal</div>
        {sub.responsavel ? <div className="flex items-center gap-2"><Avatar nome={sub.responsavel.nome} url={sub.responsavel.avatarUrl} size={30} /><b>{sub.responsavel.nome}</b></div>
          : <span className="text-[12px] text-[#8A6A00] bg-[#FFF6DA] rounded-full px-2 py-0.5">Aguardando distribuição</span>}
        {podeDistribuir && <div className="flex gap-2 mt-3 flex-wrap">
          <select id="respsel" className="h-9 border border-neutro-border rounded-[10px] px-2 text-[13px]" defaultValue={sub.responsavel?.id ?? ""}><option value="">— sem responsável —</option>{internos.map((u: any) => <option key={u.id} value={u.id}>{u.nome} ({u.funcao})</option>)}</select>
          <Button disabled={pending} onClick={() => { const v = (document.getElementById("respsel") as HTMLSelectElement).value; run(() => atribuirResponsavel(sub.id, v || null)); }}>Atribuir/Substituir</Button>
        </div>}
      </div>
      <div className="bg-white border border-neutro-border rounded-xl p-4">
        <div className="text-[12px] uppercase text-neutro-text2 font-bold mb-2">Colaboradores</div>
        <div className="flex flex-col gap-2">
          {sub.membros.map((m: any) => <div key={m.id} className="flex items-center gap-2"><Avatar nome={m.nome} url={m.avatarUrl} size={26} /><span className="flex-1">{m.nome}</span>{podeDistribuir && <Button variant="danger" className="h-8 px-3 text-[13px]" disabled={pending} onClick={() => run(() => removerMembro(sub.id, m.id))}>Remover</Button>}</div>)}
          {sub.membros.length === 0 && <span className="text-neutro-text2 text-[13px]">Nenhum colaborador.</span>}
        </div>
        {podeDistribuir && <div className="flex gap-2 mt-3 flex-wrap">
          <select id="memsel" className="h-9 border border-neutro-border rounded-[10px] px-2 text-[13px]">{internos.map((u: any) => <option key={u.id} value={u.id}>{u.nome} ({u.funcao})</option>)}</select>
          <Button disabled={pending} onClick={() => { const v = (document.getElementById("memsel") as HTMLSelectElement).value; run(() => adicionarMembro(sub.id, v)); }}>Adicionar colaborador</Button>
        </div>}
      </div>
    </div>
  );
}

function VersoesAprovacoes({ sub, versoes, vigente, impresso, pedido, perms, pending, run }: any) {
  const [link, setLink] = useState("");
  return (
    <div className="max-w-[680px]">
      <h3 className="text-[15px] font-bold mb-2">Versões</h3>
      <div className="tone-azul rounded-[10px] px-3 py-2 text-[13px] mb-3">Cada versão tem arquivo/link próprios. Referências ficam na aba “Links e referências”.</div>
      {versoes.map((v: any) => <div key={v.id} className="flex items-center gap-3 py-2.5 border-b border-dashed border-neutro-border"><span className="text-[11px] bg-neutro-surface2 border border-neutro-border rounded px-2 py-0.5">V{v.numero}</span><a href={v.link_drive} target="_blank" rel="noreferrer" className="flex-1 truncate">🔗 {v.link_drive}</a><StatusChip status={v.estado === "liberada_impressao" || v.estado === "aprovada" ? "aprovado" : v.estado === "substituida" ? "neutro" : "revisao"} /></div>)}
      {perms.podeOperacional && !perms.readonly && <div className="flex gap-2 mt-3"><input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link do Google Drive (nova versão)" className="flex-1 h-10 border border-neutro-border rounded-[10px] px-3" /><Button variant="primary" disabled={pending || !link} onClick={() => { run(async () => { const m = await import("@/server/data/versoes"); return m.adicionarVersao(sub.id, link); }); setLink(""); }}>Adicionar versão</Button></div>}
      <h3 className="text-[15px] font-bold mt-5 mb-2">Aprovações</h3>
      {!impresso ? (perms.podeAprovarDigital && vigente ? <div className="flex gap-2 flex-wrap"><Button disabled={pending} onClick={() => run(() => aprovarDigital(vigente.id, "aprovar"))}>Aprovar</Button><Button variant="danger" disabled={pending} onClick={() => run(() => aprovarDigital(vigente.id, "solicitar_correcao"))}>Solicitar correção</Button><Button variant="primary" disabled={pending} onClick={() => run(() => liberarPublicacao(vigente.id))}>Liberar para publicação</Button></div> : <p className="text-[13px] text-neutro-text2">Aprovação por Diretor/Coordenador.</p>)
        : (<div><div className="tone-amarelo rounded-[10px] px-3 py-2 text-[13px] mb-2">Impresso: Coordenador e Diretor aprovam a mesma versão; então libera-se (manual).</div>{perms.podeAprovarImpresso && vigente && <div className="flex gap-2 flex-wrap"><Button disabled={pending} onClick={() => run(() => aprovarImpresso(vigente.id))}>Registrar minha aprovação</Button><Button variant="primary" disabled={pending} onClick={() => run(() => liberarImpressao(vigente.id))}>Liberar para impressão</Button></div>}{pedido && <div className="bg-white border border-neutro-border rounded-xl p-4 mt-3 text-[13px]"><Kv k="Gráfica" v={pedido.grafica_id ?? "—"} /><Kv k="Quantidade" v={pedido.quantidade ?? "—"} /><Kv k="Local de entrega" v={pedido.local_entrega ?? "—"} /></div>}</div>)}
    </div>
  );
}
