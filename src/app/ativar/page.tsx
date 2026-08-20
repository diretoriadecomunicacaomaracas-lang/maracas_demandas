"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/Button";

// Política de senha da v2.2 (mesma usada no restante do projeto).
const politicaOk = (s: string) => s.length >= 10 && /[a-zA-Z]/.test(s) && /\d/.test(s);

// Ativação de conta convidada: o convite (Supabase) passa pelo /auth/callback,
// que cria a sessão de convite; aqui a pessoa apenas DEFINE a senha. Não cria
// usuário/perfil novo. Ao concluir, encerra a sessão temporária e vai ao /login.
export default function Ativar() {
  const [sessao, setSessao] = useState<"checando" | "ok" | "invalida">("checando");
  const [email, setEmail] = useState<string | null>(null);
  const [nova, setNova] = useState(""); const [rep, setRep] = useState("");
  const [ver, setVer] = useState(false); const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null); const [feito, setFeito] = useState(false);

  useEffect(() => {
    const sb = createSupabaseBrowser();
    sb.auth.getUser().then(({ data }) => { setEmail(data.user?.email ?? null); setSessao(data.user ? "ok" : "invalida"); });
  }, []);

  const coincide = nova.length > 0 && nova === rep;
  async function ativar(e: React.FormEvent) {
    e.preventDefault(); setErro(null);
    if (!politicaOk(nova)) { setErro("Mínimo 10 caracteres, com ao menos uma letra e um número."); return; }
    if (!coincide) { setErro("As senhas não coincidem."); return; }
    setBusy(true);
    const sb = createSupabaseBrowser();
    const { error } = await sb.auth.updateUser({ password: nova });
    setBusy(false);
    if (error) { setErro("Não foi possível ativar. O convite pode ter expirado."); return; }
    await sb.auth.signOut(); // encerra a sessão temporária do convite
    setFeito(true);
    setTimeout(() => { window.location.href = "/login"; }, 1800);
  }

  return (
    <div className="min-h-screen grid place-items-center p-5">
      <div className="w-[420px] max-w-[96vw] bg-white border border-neutro-border rounded-2xl shadow-md p-8">
        <Image src="/brand/logo-maracas-cor.png" alt="Prefeitura de Maracás" width={1633} height={603} priority className="app-brand-img h-[56px] w-auto max-w-full object-contain mx-auto mb-5" />
        <h1 className="text-center text-lg font-semibold mb-1">Ativar sua conta</h1>

        {sessao === "checando" && <p className="text-center text-neutro-text2 text-sm">Validando convite…</p>}

        {sessao === "invalida" && <>
          <div className="tone-vermelho rounded-[10px] px-3 py-2 text-sm mb-3" role="alert">Este convite é inválido ou expirou.</div>
          <p className="text-center text-neutro-text2 text-sm mb-3">Peça um novo convite ao administrador do sistema.</p>
          <div className="text-center"><a href="/login" className="text-sm font-semibold">Ir para o login</a></div>
        </>}

        {sessao === "ok" && (feito ? (
          <div className="tone-verde rounded-[10px] px-3 py-2 text-sm" role="status">Conta ativada com sucesso. Redirecionando para o login…</div>
        ) : (
          <form onSubmit={ativar}>
            <p className="text-center text-neutro-text2 text-sm mb-5">Defina uma senha para concluir seu acesso ao sistema{email ? ` (${email})` : ""}.</p>
            <label className="block text-[13px] font-semibold mb-1.5">Nova senha</label>
            <input type={ver ? "text" : "password"} required value={nova} onChange={(e) => setNova(e.target.value)} className="inp mb-3" autoComplete="new-password" />
            <label className="block text-[13px] font-semibold mb-1.5">Repetir nova senha</label>
            <input type={ver ? "text" : "password"} required value={rep} onChange={(e) => setRep(e.target.value)} className="inp mb-2" autoComplete="new-password" />
            <label className="flex items-center gap-2 text-[13px] mb-2"><input type="checkbox" checked={ver} onChange={(e) => setVer(e.target.checked)} /> Mostrar senha</label>
            <div className="text-[12px] text-neutro-text3 mb-3">Mínimo 10 caracteres, com letra e número. {rep && !coincide && <span className="text-[#B32219]">As senhas não coincidem.</span>}</div>
            {erro && <div role="alert" className="tone-vermelho rounded-[10px] px-3 py-2 text-sm mb-3">{erro}</div>}
            <Button type="submit" variant="primary" className="w-full justify-center" disabled={busy || !politicaOk(nova) || !coincide}>{busy ? "Ativando…" : "Ativar conta"}</Button>
          </form>
        ))}
      </div>
    </div>
  );
}
