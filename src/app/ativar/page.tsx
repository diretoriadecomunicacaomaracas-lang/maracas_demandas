"use client";
import { useState } from "react";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/Button";

// Ativação de conta: define a senha após o convite (link seguro de uso único). Política de senha da v2.2.
export default function Ativar() {
  const [senha, setSenha] = useState(""); const [erro, setErro] = useState<string | null>(null);
  function validaPolitica(s: string) { return s.length >= 10 && /[a-zA-Z]/.test(s) && /\d/.test(s); }
  async function ativar(e: React.FormEvent) {
    e.preventDefault(); setErro(null);
    if (!validaPolitica(senha)) { setErro("Mínimo de 10 caracteres, com ao menos uma letra e um número."); return; }
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) { setErro("Não foi possível ativar. O link pode ter expirado."); return; }
    window.location.href = "/";
  }
  return (
    <div className="min-h-screen grid place-items-center p-5">
      <form onSubmit={ativar} className="w-[420px] max-w-[96vw] bg-white border border-neutro-border rounded-2xl shadow-md p-8">
        <Image src="/brand/logo-maracas.png" alt="Prefeitura de Maracás" width={200} height={52} className="h-[52px] w-auto mx-auto mb-5" />
        <h1 className="text-center text-lg font-semibold mb-1">Ativação de conta</h1>
        <p className="text-center text-neutro-text2 text-sm mb-5">Crie sua senha para ativar o acesso.</p>
        <div className="mb-2">
          <label htmlFor="s" className="block text-[13px] font-semibold mb-1.5">Nova senha</label>
          <input id="s" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)}
            className="w-full h-10 border border-neutro-border rounded-[10px] px-3 outline-none focus:border-marca-azul" />
        </div>
        <div className="tone-azul rounded-[10px] px-3 py-2 text-[13px] mb-3">Mínimo de 10 caracteres, com ao menos uma letra e um número.</div>
        {erro && <div role="alert" className="tone-vermelho rounded-[10px] px-3 py-2 text-sm mb-3">{erro}</div>}
        <Button type="submit" variant="primary" className="w-full justify-center">Ativar conta</Button>
      </form>
    </div>
  );
}
