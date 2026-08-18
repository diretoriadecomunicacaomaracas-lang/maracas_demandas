"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { triagem } from "@/server/data/solicitacoes";

export function TriagemBotoes({ solicId, status }: { solicId: string; status?: string }) {
  const [pending, start] = useTransition(); const [msg, setMsg] = useState<string | null>(null);
  function acao(a: "iniciar_analise" | "aprovar" | "pedir_info" | "recusar" | "cancelar") {
    let justificativa: string | undefined;
    if (a === "recusar" || a === "cancelar") { const j = prompt(`Justificativa para ${a}:`); if (j === null) return; justificativa = j; }
    start(async () => { const r = await triagem(solicId, a, { justificativa }); setMsg(r.ok ? "Feito." : (r.erro ?? "Erro")); });
  }
  return (
    <div className="flex gap-1.5 items-center flex-wrap">
      {status === "enviada" && <Button className="h-8 px-3 text-[13px]" disabled={pending} onClick={() => acao("iniciar_analise")}>Iniciar análise</Button>}
      <Button variant="primary" className="h-8 px-3 text-[13px]" disabled={pending} onClick={() => acao("aprovar")}>Aprovar → Demanda</Button>
      <Button className="h-8 px-3 text-[13px]" disabled={pending} onClick={() => acao("pedir_info")}>Pedir info</Button>
      <Button variant="danger" className="h-8 px-3 text-[13px]" disabled={pending} onClick={() => acao("recusar")}>Recusar</Button>
      {msg && <span className="text-[12px] text-neutro-text2" role="status">{msg}</span>}
    </div>
  );
}
