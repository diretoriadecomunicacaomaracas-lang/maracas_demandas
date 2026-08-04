"use client";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { criarSolicitacao } from "@/server/data/solicitacoes";

const PASSOS = ["Dados básicos", "Tipo de material", "Briefing", "Data e prazo", "Revisão e envio"];
type Unidade = { id: string; nome: string };

export function NovaSolicitacaoForm({ unidades, setorPadrao }: { unidades: Unidade[]; setorPadrao: string }) {
  const [passo, setPasso] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({ tipo: "digital", unidade_id: setorPadrao || (unidades[0]?.id ?? "") });
  const [erro, setErro] = useState<string | null>(null); const [enviando, setEnviando] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function validarPasso(): boolean {
    if (passo === 0 && !form.titulo?.trim()) { setErro("Informe o título."); return false; }
    if (passo === 0 && !form.unidade_id) { setErro("Selecione o setor solicitante."); return false; }
    setErro(null); return true;
  }
  async function enviar() {
    if (!form.unidade_id) { setPasso(0); setErro("Selecione o setor solicitante."); return; }
    setErro(null); setEnviando(true);
    const fd = new FormData(); Object.entries(form).forEach(([k, v]) => fd.set(k, v));
    const r = await criarSolicitacao(fd); setEnviando(false);
    if (!r.ok) { setErro(r.erro ?? "Erro"); return; }
    window.location.href = "/portal";
  }

  return (
    <div className="min-h-screen bg-neutro-bg">
      <header className="h-16 bg-white border-b border-neutro-border flex items-center gap-3 px-5">
        <Image src="/brand/logo-maracas.png" alt="Prefeitura de Maracás" width={160} height={30} className="h-[30px] w-auto" />
        <b>Nova solicitação</b><a href="/portal" className="ml-auto text-[13px]">✕ Cancelar</a>
      </header>
      <main className="max-w-[720px] mx-auto p-5">
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {PASSOS.map((p, i) => <div key={p} className={`flex-1 min-w-[110px] border rounded-[10px] px-3 py-2 text-[12px] ${i === passo ? "border-marca-azul text-marca-azul bg-[#E7F3FF] font-bold" : i < passo ? "border-[#bfe9cf] text-[#1B7F4B] bg-[#E6F8EE]" : "border-neutro-border text-neutro-text2 bg-white"}`}><b>{i < passo ? "✓" : i + 1}</b> {p}</div>)}
        </div>
        <div className="bg-white border border-neutro-border rounded-xl p-5">
          {passo === 0 && (<>
            <Field label="Título da solicitação"><input className="inp" value={form.titulo ?? ""} onChange={(e) => set("titulo", e.target.value)} /></Field>
            <Field label="Setor solicitante (obrigatório)">
              {unidades.length === 0
                ? <div className="tone-vermelho rounded-[10px] px-3 py-2 text-[13px]">Sua secretaria ainda não possui setores cadastrados. Peça ao Administrador para cadastrar em Administração → Setores.</div>
                : <select className="inp" value={form.unidade_id} onChange={(e) => set("unidade_id", e.target.value)} aria-label="Setor solicitante" required>
                    <option value="">Selecione…</option>
                    {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>}
              <div className="text-[12px] text-neutro-text2 mt-1">Somente setores da sua secretaria. O setor padrão do seu perfil já vem selecionado (quando houver).</div>
            </Field>
          </>)}
          {passo === 1 && <Field label="Tipo de material"><select className="inp" value={form.tipo} onChange={(e) => set("tipo", e.target.value)}><option value="digital">Digital</option><option value="audiovisual">Audiovisual</option><option value="impresso">Impresso</option></select></Field>}
          {passo === 2 && <Field label="Briefing"><textarea className="inp" style={{ height: 100 }} value={form.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} /></Field>}
          {passo === 3 && (<><Field label="Data e horário desejados"><input type="datetime-local" className="inp" value={form.prazo ?? ""} onChange={(e) => set("prazo", e.target.value)} /></Field>
            <div className="tone-amarelo rounded-[10px] px-3 py-2 text-[13px]">⚠ Antecedência mínima de 24 horas. Prazos menores serão bloqueados no envio.</div></>)}
          {passo === 4 && <div className="text-[13px]"><b>{form.titulo || "(sem título)"}</b>
            <div className="text-neutro-text2 mt-1">Setor: {unidades.find((u) => u.id === form.unidade_id)?.nome ?? "—"} · Tipo: {form.tipo} · Prazo: {form.prazo || "—"}</div></div>}
        </div>
        {erro && <div role="alert" className="tone-vermelho rounded-[10px] px-3 py-2 text-sm mt-3">{erro}</div>}
        <div className="flex justify-between mt-4">
          <Button disabled={passo === 0} onClick={() => setPasso((p) => p - 1)}>Voltar</Button>
          {passo < 4 ? <Button variant="primary" onClick={() => { if (validarPasso()) setPasso((p) => p + 1); }}>Continuar</Button>
            : <Button variant="primary" disabled={enviando || !form.unidade_id} onClick={enviar}>{enviando ? "Enviando…" : "Enviar solicitação"}</Button>}
        </div>
      </main>
      <style>{`.inp{width:100%;height:40px;border:1px solid var(--border);border-radius:10px;padding:0 12px;outline:none}.inp:focus{border-color:var(--azul)}textarea.inp{height:auto}`}</style>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block mb-3"><span className="block text-[13px] font-semibold mb-1.5">{label}</span>{children}</label>;
}
