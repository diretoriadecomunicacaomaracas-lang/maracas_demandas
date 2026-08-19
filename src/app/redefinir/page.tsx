"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/Button";

const politicaOk = (s: string) => s.length >= 10 && /[a-zA-Z]/.test(s) && /\d/.test(s);

export default function Redefinir() {
  const [sessao, setSessao] = useState<"checando" | "ok" | "invalida">("checando");
  const [nova, setNova] = useState(""); const [rep, setRep] = useState("");
  const [ver, setVer] = useState(false); const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null); const [feito, setFeito] = useState(false);

  useEffect(() => {
    const sb = createSupabaseBrowser();
    sb.auth.getUser().then(({ data }) => setSessao(data.user ? "ok" : "invalida"));
  }, []);

  const coincide = nova.length > 0 && nova === rep;
  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setErro(null);
    if (!politicaOk(nova)) { setErro("Mínimo 10 caracteres, com ao menos uma letra e um número."); return; }
    if (!coincide) { setErro("As senhas não coincidem."); return; }
    setBusy(true);
    const sb = createSupabaseBrowser();
    const { error } = await sb.auth.updateUser({ password: nova });
    setBusy(false);
    if (error) { setErro("Não foi possível redefinir. O link pode ter expirado."); return; }
    await sb.auth.signOut(); // invalida o estado de recuperação
    setFeito(true);
    setTimeout(() => { window.location.href = "/login"; }, 1800);
  }

  return (
    <div className="min-h-screen grid place-items-center p-5">
      <div className="w-[420px] max-w-[96vw] bg-white border border-neutro-border rounded-2xl shadow-md p-8">
        <Image src="/brand/logo-maracas.png" alt="Prefeitura de Maracás" width={200} height={52} className="h-[52px] w-auto mx-auto mb-5" />
        <h1 className="text-center text-lg font-semibold mb-1">Redefinir senha</h1>
        {sessao === "checando" && <p className="text-center text-neutro-text2 text-sm">Validando link…</p>}
        {sessao === "invalida" && <>
          <div className="tone-vermelho rounded-[10px] px-3 py-2 text-sm mb-3" role="alert">Link inválido ou expirado. Solicite a recuperação novamente.</div>
          <div className="text-center"><a href="/recuperar" className="text-sm font-semibold">Recuperar senha</a></div>
        </>}
        {sessao === "ok" && (feito ? (
          <div className="tone-verde rounded-[10px] px-3 py-2 text-sm" role="status">Senha redefinida! Redirecionando para o login…</div>
        ) : (
          <form onSubmit={salvar}>
            <p className="text-center text-neutro-text2 text-sm mb-5">Crie sua nova senha de acesso.</p>
            <label className="block text-[13px] font-semibold mb-1.5">Nova senha</label>
            <input type={ver ? "text" : "password"} required value={nova} onChange={(e) => setNova(e.target.value)} className="inp mb-3" autoComplete="new-password" />
            <label className="block text-[13px] font-semibold mb-1.5">Repetir nova senha</label>
            <input type={ver ? "text" : "password"} required value={rep} onChange={(e) => setRep(e.target.value)} className="inp mb-2" autoComplete="new-password" />
            <label className="flex items-center gap-2 text-[13px] mb-2"><input type="checkbox" checked={ver} onChange={(e) => setVer(e.target.checked)} /> Mostrar senha</label>
            <div className="text-[12px] text-neutro-text3 mb-3">Mínimo 10 caracteres, com letra e número. {rep && !coincide && <span className="text-[#B32219]">As senhas não coincidem.</span>}</div>
            {erro && <div role="alert" className="tone-vermelho rounded-[10px] px-3 py-2 text-sm mb-3">{erro}</div>}
            <Button type="submit" variant="primary" className="w-full justify-center" disabled={busy || !politicaOk(nova) || !coincide}>{busy ? "Salvando…" : "Redefinir senha"}</Button>
          </form>
        ))}
      </div>
    </div>
  );
}
