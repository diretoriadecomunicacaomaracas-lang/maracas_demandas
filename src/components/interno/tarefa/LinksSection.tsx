"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { adicionarLinkRef, removerLinkRef } from "@/server/data/links";

const TIPOS = ["referencia", "pasta_drive", "apoio", "publicacao_anterior", "roteiro", "documento", "banco_imagens", "outro"];
export function LinksSection({ subId, links, podeEditar }: { subId: string; links: any[]; podeEditar: boolean }) {
  const [tipo, setTipo] = useState("referencia"); const [titulo, setTitulo] = useState(""); const [url, setUrl] = useState("");
  const [pending, start] = useTransition(); const [msg, setMsg] = useState<string | null>(null);
  function add() { start(async () => { const r = await adicionarLinkRef(subId, { tipo, titulo, url }); setMsg(r.ok ? "Link adicionado." : (r.erro ?? "Erro")); if (r.ok) { setTitulo(""); setUrl(""); } }); }
  function copiar(u: string) { navigator.clipboard?.writeText(u); setMsg("Endereço copiado."); }
  return (
    <div className="max-w-[720px]">
      <div className="tone-amarelo rounded-[10px] px-3 py-2 text-[13px] mb-3">Estes são <b>links de referência</b> — não são versões oficiais. Versões ficam na aba “Versões e aprovações”.</div>
      {msg && <div role="status" className="tone-azul rounded-[10px] px-3 py-2 text-sm mb-3">{msg}</div>}
      <div className="bg-white border border-neutro-border rounded-xl divide-y divide-neutro-border">
        {links.length === 0 && <div className="p-4 text-neutro-text2 text-[13px]">Nenhum link ainda.</div>}
        {links.map((l) => (
          <div key={l.id} className="p-3 flex items-center gap-3">
            <span className="text-[11px] bg-neutro-surface2 border border-neutro-border rounded px-2 py-0.5">{l.tipo}</span>
            <div className="flex-1 min-w-0"><a href={l.url} target="_blank" rel="noreferrer" className="font-semibold truncate block">{l.titulo || l.url}</a>{l.descricao && <div className="text-[12px] text-neutro-text2">{l.descricao}</div>}</div>
            <button className="text-[12px] text-marca-azul" onClick={() => copiar(l.url)}>Copiar</button>
            {podeEditar && <button className="text-[12px] text-[#B32219]" onClick={() => start(async () => { await removerLinkRef(l.id, subId); })}>Remover</button>}
          </div>
        ))}
      </div>
      {podeEditar && (
        <div className="bg-white border border-neutro-border rounded-xl p-3 mt-3 flex gap-2 flex-wrap items-center">
          <select className="h-9 border border-neutro-border rounded-[10px] px-2 text-[13px]" value={tipo} onChange={(e) => setTipo(e.target.value)}>{TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          <input className="h-9 border border-neutro-border rounded-[10px] px-2 text-[13px] flex-1 min-w-[120px]" placeholder="Título/descrição" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <input className="h-9 border border-neutro-border rounded-[10px] px-2 text-[13px] flex-1 min-w-[160px]" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button variant="primary" disabled={pending || !url} onClick={add}>Adicionar</Button>
        </div>
      )}
    </div>
  );
}
