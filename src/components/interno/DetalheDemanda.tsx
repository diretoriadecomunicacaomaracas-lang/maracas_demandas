"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { adicionarVersao } from "@/server/data/versoes";
import { aprovarDigital, liberarPublicacao, aprovarImpresso, liberarImpressao } from "@/server/data/aprovacoes";
import { atribuirResponsavel, adicionarMembro, removerMembro, finalizarDemanda } from "@/server/data/demandas";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";

const ABAS = ["Resumo","Responsáveis","Versões","Aprovações","Impressão","Histórico"] as const;

export function DetalheDemanda({ sub, versoes, aprovacoes, pedido, historico, equipe, internos, perms }: any) {
  const [aba, setAba] = useState<typeof ABAS[number]>("Resumo");
  const [link, setLink] = useState(""); const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const vigente = versoes.find((v: any) => v.vigente) ?? versoes[versoes.length - 1];
  const impresso = sub.tipo === "impresso";
  function run(fn: () => Promise<any>) { start(async () => { const r = await fn(); setMsg(r?.ok ? "Feito." : (r?.pendencias?.join(" · ") ?? r?.erro ?? "Erro")); }); }

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className="text-[11px] bg-neutro-surface2 border border-neutro-border rounded px-2 py-0.5">{sub.tipo}</span>
        <StatusChip status={sub.etapa} />
      </div>
      <h1 className="text-[22px] font-bold">{sub.titulo}</h1>
      <p className="text-neutro-text2 text-[13px] mb-3">Versão vigente: {vigente ? `V${vigente.numero}` : "—"}</p>
      <div className="flex gap-1 border-b border-neutro-border mb-4 overflow-x-auto">
        {ABAS.filter(a => a !== "Impressão" || impresso).map(a => (
          <button key={a} onClick={() => setAba(a)} className={`px-3 py-2.5 text-[13px] font-semibold border-b-2 ${aba === a ? "text-marca-azul border-marca-azul" : "text-neutro-text2 border-transparent"}`}>{a}</button>
        ))}
      </div>
      {msg && <div role="status" className="tone-azul rounded-[10px] px-3 py-2 text-sm mb-3">{msg}</div>}

      {aba === "Resumo" && (
        <div className="max-w-[560px]">
          <div className="bg-white border border-neutro-border rounded-xl p-4">
            <Kv k="Tipo" v={sub.tipo} /><Kv k="Etapa" v={sub.etapa} /><Kv k="Prazo" v={sub.prazo ? new Date(sub.prazo).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"} />
          </div>
          {perms.podeDistribuir && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <Button disabled={pending} onClick={() => { if (confirm("Finalizar esta demanda? A solicitação vinculada será marcada como concluída.")) run(() => finalizarDemanda(sub.id)); }}>Finalizar demanda</Button>
            </div>
          )}
        </div>
      )}

      {aba === "Responsáveis" && (
        <div className="max-w-[620px]">
          <div className="bg-white border border-neutro-border rounded-xl p-4 mb-3">
            <div className="text-[12px] uppercase text-neutro-text2 font-bold mb-2">Responsável principal</div>
            {equipe?.responsavel
              ? <div className="flex items-center gap-2"><Avatar nome={equipe.responsavel.nome} url={equipe.responsavel.avatarUrl} size={30} /><b>{equipe.responsavel.nome}</b></div>
              : <span className="text-[12px] text-[#8A6A00] bg-[#FFF6DA] rounded-full px-2 py-0.5">Aguardando distribuição</span>}
            {perms.podeDistribuir && (
              <div className="flex gap-2 mt-3 flex-wrap">
                <select id="respsel" className="h-9 border border-neutro-border rounded-[10px] px-2 text-[13px]" defaultValue={equipe?.responsavel?.id ?? ""}>
                  <option value="">— sem responsável —</option>
                  {internos.map((u: any) => <option key={u.id} value={u.id}>{u.nome} ({u.funcao})</option>)}
                </select>
                <Button disabled={pending} onClick={() => { const v = (document.getElementById("respsel") as HTMLSelectElement).value; run(() => atribuirResponsavel(sub.id, v || null)); }}>Atribuir/Substituir</Button>
              </div>
            )}
          </div>
          <div className="bg-white border border-neutro-border rounded-xl p-4">
            <div className="text-[12px] uppercase text-neutro-text2 font-bold mb-2">Colaboradores</div>
            <div className="flex flex-col gap-2">
              {(equipe?.membros ?? []).map((m: any) => (
                <div key={m.id} className="flex items-center gap-2">
                  <Avatar nome={m.nome} url={m.avatarUrl} size={26} /><span className="flex-1">{m.nome}</span>
                  {perms.podeDistribuir && <Button variant="danger" className="h-8 px-3 text-[13px]" disabled={pending} onClick={() => run(() => removerMembro(sub.id, m.id))}>Remover</Button>}
                </div>
              ))}
              {(equipe?.membros ?? []).length === 0 && <span className="text-neutro-text2 text-[13px]">Nenhum colaborador.</span>}
            </div>
            {perms.podeDistribuir && (
              <div className="flex gap-2 mt-3 flex-wrap">
                <select id="memsel" className="h-9 border border-neutro-border rounded-[10px] px-2 text-[13px]">
                  {internos.map((u: any) => <option key={u.id} value={u.id}>{u.nome} ({u.funcao})</option>)}
                </select>
                <Button disabled={pending} onClick={() => { const v = (document.getElementById("memsel") as HTMLSelectElement).value; run(() => adicionarMembro(sub.id, v)); }}>Adicionar colaborador</Button>
              </div>
            )}
            {!perms.podeDistribuir && <div className="text-[12px] text-neutro-text2 mt-2">Somente Diretor/Coordenador alteram a distribuição.</div>}
          </div>
        </div>
      )}

      {aba === "Versões" && (
        <div className="max-w-[640px]">
          <div className="tone-azul rounded-[10px] px-3 py-2 text-[13px] mb-3">Cada versão tem um arquivo/link próprios do Drive. O mesmo arquivo não pode ser duas versões.</div>
          {versoes.map((v: any) => (
            <div key={v.id} className="flex items-center gap-3 py-2.5 border-b border-dashed border-neutro-border">
              <span className="text-[11px] bg-neutro-surface2 border border-neutro-border rounded px-2 py-0.5">V{v.numero}</span>
              <a href={v.link_drive} target="_blank" rel="noreferrer" className="flex-1 truncate">🔗 {v.link_drive}</a>
              <StatusChip status={v.estado === "liberada_impressao" || v.estado === "aprovada" ? "aprovado" : v.estado === "substituida" ? "neutro" : "revisao"} />
            </div>
          ))}
          {perms.podeEditar && (
            <div className="flex gap-2 mt-3">
              <input value={link} onChange={e => setLink(e.target.value)} placeholder="Cole o link do Google Drive" aria-label="Link do Drive"
                className="flex-1 h-10 border border-neutro-border rounded-[10px] px-3 outline-none focus:border-marca-azul" />
              <Button variant="primary" disabled={pending || !link} onClick={() => run(() => adicionarVersao(sub.id, link))}>Adicionar versão</Button>
            </div>
          )}
        </div>
      )}

      {aba === "Aprovações" && (
        <div className="max-w-[560px]">
          {!impresso ? (
            <>
              <p className="text-[13px] text-neutro-text2 mb-3">Digital/audiovisual: aprovar e liberar publicação são ações separadas (basta Diretor ou Coordenador em cada uma).</p>
              {perms.podeAprovarDigital && vigente && (
                <div className="flex gap-2 flex-wrap">
                  <Button disabled={pending} onClick={() => run(() => aprovarDigital(vigente.id, "aprovar"))}>Aprovar</Button>
                  <Button variant="danger" disabled={pending} onClick={() => run(() => aprovarDigital(vigente.id, "solicitar_correcao"))}>Solicitar correção</Button>
                  <Button variant="primary" disabled={pending} onClick={() => run(() => liberarPublicacao(vigente.id))}>Liberar para publicação</Button>
                </div>
              )}
            </>
          ) : <p className="text-[13px] text-neutro-text2">Este material é impresso — veja a aba Impressão.</p>}
        </div>
      )}

      {aba === "Impressão" && impresso && (
        <div className="max-w-[560px]">
          <div className="tone-amarelo rounded-[10px] px-3 py-2 text-[13px] mb-3">Impresso exige aprovação do Coordenador e do Diretor na mesma versão. Só então a liberação (manual) fica disponível.</div>
          {perms.podeAprovarImpresso && vigente && (
            <div className="flex gap-2 flex-wrap">
              <Button disabled={pending} onClick={() => run(() => aprovarImpresso(vigente.id))}>Registrar minha aprovação</Button>
              <Button variant="primary" disabled={pending} onClick={() => run(() => liberarImpressao(vigente.id))}>Liberar para impressão</Button>
            </div>
          )}
          {pedido && <div className="bg-white border border-neutro-border rounded-xl p-4 mt-3">
            <Kv k="Gráfica" v={pedido.grafica_id ?? "—"} /><Kv k="Quantidade" v={pedido.quantidade ?? "—"} /><Kv k="Formato" v={pedido.formato ?? "—"} /><Kv k="Local de entrega" v={pedido.local_entrega ?? "—"} />
          </div>}
        </div>
      )}

      {aba === "Histórico" && (
        <div className="max-w-[560px]">
          {historico.map((h: any, i: number) => (
            <div key={i} className="flex gap-3 py-2.5 border-b border-dashed border-neutro-border">
              <span className="text-marca-azul">●</span>
              <div><div className="text-[13.5px]">{h.acao}{h.justificativa ? ` — ${h.justificativa}` : ""}</div>
                <div className="text-[12px] text-neutro-text2">{new Date(h.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</div></div>
            </div>
          ))}
          {historico.length === 0 && <p className="text-neutro-text2 text-[13px]">Sem registros ainda.</p>}
        </div>
      )}
    </div>
  );
}
function Kv({ k, v }: { k: string; v: any }) {
  return <div className="flex gap-2 py-2 border-b border-dashed border-neutro-border text-[13px]"><div className="w-40 text-neutro-text2">{k}</div><div className="font-medium">{String(v)}</div></div>;
}
