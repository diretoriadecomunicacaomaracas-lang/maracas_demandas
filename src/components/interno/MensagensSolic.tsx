"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { enviarMensagemSolic } from "@/server/data/solicitacoes";

export function MensagensSolic({ solicId, mensagens }: { solicId: string; mensagens: any[] }) {
  const [texto, setTexto] = useState(""); const [pending, start] = useTransition();
  function enviar() { if (!texto.trim()) return; start(async () => { await enviarMensagemSolic(solicId, texto); setTexto(""); }); }
  return (
    <div className="mt-2">
      {mensagens.map((m: any) => (
        <div key={m.id} className="py-2 border-b border-dashed border-neutro-border">
          <div className="text-[12px] text-neutro-text2">{m.origem} · {new Date(m.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</div>
          <div className="text-[13.5px]">{m.conteudo}</div>
        </div>
      ))}
      <div className="flex gap-2 mt-3">
        <input value={texto} onChange={e => setTexto(e.target.value)} aria-label="Mensagem" placeholder="Escreva uma mensagem…"
          className="flex-1 h-10 border border-neutro-border rounded-[10px] px-3 outline-none focus:border-marca-azul" />
        <Button variant="primary" disabled={pending} onClick={enviar}>Enviar</Button>
      </div>
    </div>
  );
}
