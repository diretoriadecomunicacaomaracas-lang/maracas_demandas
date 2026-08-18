"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { adicionarItem, alternarItem, removerItem } from "@/server/data/checklist";

export function ChecklistSection({ subId, itens, podeEditar }: { subId: string; itens: any[]; podeEditar: boolean }) {
  const [novo, setNovo] = useState(""); const [pending, start] = useTransition();
  const feitos = itens.filter((i) => i.concluido).length;
  return (
    <div className="max-w-[620px]">
      <div className="flex items-center justify-between mb-2"><h3 className="text-[15px] font-bold">Checklist</h3><span className="text-[12px] text-neutro-text2">{feitos}/{itens.length} concluídos</span></div>
      <div className="bg-white border border-neutro-border rounded-xl divide-y divide-neutro-border">
        {itens.length === 0 && <div className="p-4 text-neutro-text2 text-[13px]">Sem itens.</div>}
        {itens.map((i) => (
          <label key={i.id} className="p-3 flex items-center gap-3">
            <input type="checkbox" checked={i.concluido} disabled={!podeEditar || pending} onChange={(e) => start(async () => { await alternarItem(i.id, subId, e.target.checked); })} />
            <span className={`flex-1 ${i.concluido ? "line-through text-neutro-text3" : ""}`}>{i.descricao}</span>
            {podeEditar && <button className="text-[12px] text-[#B32219]" onClick={() => start(async () => { await removerItem(i.id, subId); })}>Remover</button>}
          </label>
        ))}
      </div>
      {podeEditar && (
        <div className="flex gap-2 mt-3">
          <input className="flex-1 h-9 border border-neutro-border rounded-[10px] px-2 text-[13px]" placeholder="Novo item…" value={novo} onChange={(e) => setNovo(e.target.value)} />
          <Button variant="primary" disabled={pending || !novo.trim()} onClick={() => start(async () => { const r = await adicionarItem(subId, novo); if (r.ok) setNovo(""); })}>Adicionar</Button>
        </div>
      )}
    </div>
  );
}
