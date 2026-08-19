"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { lerTema, aplicarTema, type Tema } from "@/lib/tema";

const politicaOk = (s: string) => s.length >= 10 && /[a-zA-Z]/.test(s) && /\d/.test(s);

export function ConfigForm({ email }: { email: string }) {
  const toast = useToast();
  const [atual, setAtual] = useState(""); const [nova, setNova] = useState(""); const [rep, setRep] = useState("");
  const [ver, setVer] = useState(false); const [busy, setBusy] = useState(false);
  const [tema, setTema] = useState<Tema>("sistema");
  useEffect(() => { setTema(lerTema()); }, []);

  const coincide = nova.length > 0 && nova === rep;
  const podeSalvar = !!atual && politicaOk(nova) && coincide && !busy;

  async function trocarSenha() {
    if (!politicaOk(nova)) { toast.erro("Nova senha: mínimo 10 caracteres, com letra e número."); return; }
    if (!coincide) { toast.erro("As senhas não coincidem."); return; }
    setBusy(true);
    try {
      const sb = createSupabaseBrowser();
      const { error: e1 } = await sb.auth.signInWithPassword({ email, password: atual });
      if (e1) { toast.erro("Senha atual incorreta."); return; }
      const { error: e2 } = await sb.auth.updateUser({ password: nova });
      if (e2) { toast.erro("Não foi possível alterar a senha."); return; }
      setAtual(""); setNova(""); setRep("");
      toast.sucesso("Senha alterada com sucesso.");
    } finally { setBusy(false); }
  }
  function escolherTema(t: Tema) { setTema(t); aplicarTema(t); }

  return (
    <div className="flex flex-col gap-4 max-w-[560px]">
      <section className="card card-pad">
        <h2 className="font-bold text-[15px] mb-3">Segurança · alterar senha</h2>
        <div className="flex flex-col gap-3">
          <Campo label="Senha atual"><input type={ver ? "text" : "password"} className="inp" value={atual} onChange={(e) => setAtual(e.target.value)} autoComplete="current-password" /></Campo>
          <Campo label="Nova senha"><input type={ver ? "text" : "password"} className="inp" value={nova} onChange={(e) => setNova(e.target.value)} autoComplete="new-password" /></Campo>
          <Campo label="Repetir nova senha"><input type={ver ? "text" : "password"} className="inp" value={rep} onChange={(e) => setRep(e.target.value)} autoComplete="new-password" /></Campo>
          <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={ver} onChange={(e) => setVer(e.target.checked)} /> Mostrar senhas</label>
          <div className="text-[12px] text-neutro-text3">Mínimo 10 caracteres, com ao menos uma letra e um número. {nova && !politicaOk(nova) && <span className="text-[#B32219]">Não atende aos requisitos.</span>} {rep && !coincide && <span className="text-[#B32219]">As senhas não coincidem.</span>}</div>
          <div><Button variant="primary" disabled={!podeSalvar} onClick={trocarSenha}>{busy ? "Salvando…" : "Alterar senha"}</Button></div>
        </div>
      </section>
      <section className="card card-pad">
        <h2 className="font-bold text-[15px] mb-3">Aparência</h2>
        <div className="flex gap-2 flex-wrap">
          {([["claro", "☀️ Claro"], ["escuro", "🌙 Escuro"], ["sistema", "🖥 Sistema"]] as [Tema, string][]).map(([t, lab]) => (
            <button key={t} onClick={() => escolherTema(t)} className={`h-10 px-4 rounded-md font-semibold text-sm border pressable ${tema === t ? "border-marca-azul text-marca-azul bg-[#E7F3FF]" : "border-neutro-border text-neutro-text2"}`}>{lab}</button>
          ))}
        </div>
        <p className="text-[12px] text-neutro-text3 mt-2">A preferência é salva e aplicada em todas as telas.</p>
      </section>
    </div>
  );
}
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-[13px] font-semibold mb-1">{label}</span>{children}</label>;
}
