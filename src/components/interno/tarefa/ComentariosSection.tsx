"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { comentar, excluirComentario } from "@/server/data/comentarios";

export function ComentariosSection({ subId, comentarios, internos, meId }: { subId: string; comentarios: any[]; internos: { id: string; nome: string }[]; meId: string }) {
  const [texto, setTexto] = useState(""); const [pending, start] = useTransition();
  const dt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  function enviar() {
    // menções: procura @Nome (primeiro nome) na lista de internos
    const mencoes = internos.filter((u) => new RegExp(`@${u.nome.split(" ")[0]}`, "i").test(texto)).map((u) => u.id);
    start(async () => { const r = await comentar(subId, texto, mencoes); if (r.ok) setTexto(""); });
  }
  return (
    <div className="max-w-[680px]">
      {comentarios.map((c) => (
        <div key={c.id} className="flex gap-2 mb-3">
          <Avatar nome={c.autor} url={c.avatarUrl} size={28} />
          <div className="flex-1">
            <div className="text-[12px] text-neutro-text2"><b className="text-neutro-text">{c.autor}</b> · {dt(c.created_at)} {c.editada && <span>· editado</span>}</div>
            <div className="bg-white border border-neutro-border rounded-[10px] px-3 py-2 text-[13.5px] whitespace-pre-wrap">{c.conteudo}</div>
            {c.autor_id === meId && <button className="text-[11px] text-[#B32219] mt-1" onClick={() => start(async () => { await excluirComentario(c.id, subId); })}>Excluir</button>}
          </div>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <input className="flex-1 h-10 border border-neutro-border rounded-[10px] px-3 text-[14px]" placeholder="Comentar… use @Nome para mencionar" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <Button variant="primary" disabled={pending || !texto.trim()} onClick={enviar}>Enviar</Button>
      </div>
    </div>
  );
}
