"use client";
import { useState } from "react";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/Button";

export default function Recuperar() {
  const [email, setEmail] = useState(""); const [enviado, setEnviado] = useState(false);
  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createSupabaseBrowser();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback` });
    setEnviado(true);
  }
  return (
    <div className="min-h-screen grid place-items-center p-5">
      <form onSubmit={enviar} className="w-[420px] max-w-[96vw] bg-white border border-neutro-border rounded-2xl shadow-md p-8">
        <Image src="/brand/logo-maracas.png" alt="Prefeitura de Maracás" width={200} height={52} className="h-[52px] w-auto mx-auto mb-5" />
        <h1 className="text-center text-lg font-semibold mb-1">Recuperar senha</h1>
        <p className="text-center text-neutro-text2 text-sm mb-5">Enviaremos um link seguro ao seu e-mail.</p>
        {enviado ? (
          <div className="tone-verde rounded-[10px] px-3 py-2 text-sm" role="status">Se o e-mail existir, o link foi enviado.</div>
        ) : (<>
          <div className="mb-3">
            <label htmlFor="e" className="block text-[13px] font-semibold mb-1.5">E-mail</label>
            <input id="e" type="email" required value={email} onChange={(ev) => setEmail(ev.target.value)}
              className="w-full h-10 border border-neutro-border rounded-[10px] px-3 outline-none focus:border-marca-azul" />
          </div>
          <Button type="submit" variant="primary" className="w-full justify-center">Enviar link</Button>
        </>)}
        <div className="text-center mt-4"><a href="/login" className="text-sm">Voltar ao login</a></div>
      </form>
    </div>
  );
}
