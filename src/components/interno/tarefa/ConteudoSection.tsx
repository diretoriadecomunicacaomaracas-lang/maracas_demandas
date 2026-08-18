"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { camposDe } from "@/domain/conteudo";
import { editarOperacional } from "@/server/data/demandas";
import { useDirtyGuard } from "./useDirty";

export function ConteudoSection({ subId, tipo, conteudo, podeEditar }: { subId: string; tipo: string; conteudo: Record<string, any>; podeEditar: boolean }) {
  const campos = camposDe(tipo);
  const [edit, setEdit] = useState(false);
  const [val, setVal] = useState<Record<string, any>>(conteudo ?? {});
  const [orig] = useState<Record<string, any>>(conteudo ?? {});
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dirty = edit && JSON.stringify(val) !== JSON.stringify(orig);
  useDirtyGuard(dirty);
  function salvar() { start(async () => { const r = await editarOperacional(subId, { conteudo: val }); setMsg(r.ok ? "Conteúdo salvo." : (r.erro ?? "Erro")); if (r.ok) setEdit(false); }); }
  return (
    <div className="max-w-[720px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-bold">Roteiro e conteúdo <span className="text-[12px] text-neutro-text2 font-normal capitalize">({tipo})</span></h3>
        {podeEditar && !edit && <Button className="h-8 px-3 text-[13px]" onClick={() => setEdit(true)}>Editar</Button>}
      </div>
      {msg && <div role="status" className="tone-azul rounded-[10px] px-3 py-2 text-sm mb-3">{msg}</div>}
      <div className="bg-white border border-neutro-border rounded-xl p-4 flex flex-col gap-3">
        {campos.map((c) => (
          <label key={c.chave} className="block">
            <span className="block text-[12px] font-semibold text-neutro-text2 mb-1">{c.label}</span>
            {!edit ? <div className="text-[14px] whitespace-pre-wrap min-h-[20px]">{val[c.chave] || <span className="text-neutro-text3">—</span>}</div>
              : c.tipo === "textoLongo"
                ? <textarea className="w-full border border-neutro-border rounded-[10px] p-2 outline-none focus:border-marca-azul" style={{ minHeight: 70 }} value={val[c.chave] ?? ""} onChange={(e) => setVal((v) => ({ ...v, [c.chave]: e.target.value }))} />
                : <input type={c.tipo === "data" ? "date" : c.tipo === "hora" ? "time" : "text"} className="w-full h-9 border border-neutro-border rounded-[10px] px-2 outline-none focus:border-marca-azul" value={val[c.chave] ?? ""} onChange={(e) => setVal((v) => ({ ...v, [c.chave]: e.target.value }))} />}
          </label>
        ))}
      </div>
      {edit && <div className="flex gap-2 mt-3">
        <Button variant="primary" disabled={pending} onClick={salvar}>{pending ? "Salvando…" : "Salvar alterações"}</Button>
        <Button disabled={pending} onClick={() => { if (!dirty || confirm("Descartar alterações não salvas?")) { setVal(orig); setEdit(false); } }}>Cancelar</Button>
        {dirty && <span className="text-[12px] text-[#8A6A00] self-center">Alterações não salvas</span>}
      </div>}
    </div>
  );
}
