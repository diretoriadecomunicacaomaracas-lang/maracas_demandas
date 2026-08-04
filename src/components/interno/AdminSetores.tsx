"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { criarUnidade } from "@/server/data/unidades";

type Sec = { id: string; nome: string };
type Uni = { id: string; nome: string; secretaria_id: string; secretarias?: { nome: string } };

export function AdminSetores({ secretarias, unidades }: { secretarias: Sec[]; unidades: Uni[] }) {
  const [sec, setSec] = useState(secretarias[0]?.id ?? ""); const [nome, setNome] = useState("");
  const [pending, start] = useTransition(); const [msg, setMsg] = useState<string | null>(null);
  function criar() {
    start(async () => { const r = await criarUnidade(sec, nome); setMsg(r.ok ? "Setor cadastrado." : (r.erro ?? "Erro")); if (r.ok) setNome(""); });
  }
  return (
    <div className="bg-white border border-neutro-border rounded-xl p-4">
      <b>Setores / Unidades</b>
      <div className="flex gap-2 mt-3 flex-wrap">
        <select className="h-10 border border-neutro-border rounded-[10px] px-2 text-[13px]" value={sec} onChange={(e) => setSec(e.target.value)} aria-label="Secretaria">
          {secretarias.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <input className="h-10 border border-neutro-border rounded-[10px] px-3 flex-1 min-w-[160px] outline-none focus:border-marca-azul" placeholder="Nome do setor (ex.: Transporte da Saúde)" value={nome} onChange={(e) => setNome(e.target.value)} aria-label="Nome do setor" />
        <Button variant="primary" disabled={pending || !nome.trim()} onClick={criar}>Cadastrar</Button>
      </div>
      {msg && <div role="status" className="tone-azul rounded-[10px] px-3 py-2 text-sm mt-2">{msg}</div>}
      <ul className="mt-3 list-none p-0">
        {unidades.map((u) => <li key={u.id} className="py-1.5 border-b border-dashed border-neutro-border text-[13px]">{u.nome} <span className="text-neutro-text2">· {u.secretarias?.nome ?? ""}</span></li>)}
        {unidades.length === 0 && <li className="text-neutro-text2 text-[13px]">Nenhum setor cadastrado ainda.</li>}
      </ul>
    </div>
  );
}
