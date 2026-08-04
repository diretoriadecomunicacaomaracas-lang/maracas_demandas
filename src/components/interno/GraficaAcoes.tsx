"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { confirmarVersao, atualizarProducao } from "@/server/data/grafica";

export function GraficaAcoes({ pedidoId, temVersao, status }: { pedidoId: string; temVersao: boolean; status: string }) {
  const [pending, start] = useTransition(); const [msg, setMsg] = useState<string | null>(null);
  const run = (fn: () => Promise<any>) => start(async () => { const r = await fn(); setMsg(r?.ok ? "Feito." : (r?.erro ?? "Erro")); });
  return (
    <div className="bg-white border border-neutro-border rounded-xl p-4">
      <b>Produção</b>
      {msg && <div role="status" className="tone-azul rounded-[10px] px-3 py-2 text-sm my-2">{msg}</div>}
      <div className="flex flex-col gap-2 mt-3">
        <Button variant="primary" disabled={pending || !temVersao} onClick={() => run(() => confirmarVersao(pedidoId))}>✔ Confirmar versão</Button>
        <div className="flex gap-2 flex-wrap">
          <Button disabled={pending} onClick={() => run(() => atualizarProducao(pedidoId, "prod_grafica"))}>Em produção</Button>
          <Button disabled={pending} onClick={() => run(() => atualizarProducao(pedidoId, "pronto"))}>Pronto</Button>
          <Button disabled={pending} onClick={() => run(() => atualizarProducao(pedidoId, "transporte"))}>Em transporte</Button>
          <Button disabled={pending} onClick={() => run(() => atualizarProducao(pedidoId, "entregue"))}>Entregue</Button>
        </div>
      </div>
    </div>
  );
}
