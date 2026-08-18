"use client";
import { useState } from "react";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState(""); const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null); const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault(); setErro(null); setCarregando(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      setCarregando(false);
      if (error) {
        console.error("[login] Supabase auth error:", error);
        setErro(error.message === "Invalid login credentials"
          ? "E-mail ou senha inválidos."
          : `Não foi possível entrar: ${error.message}`);
        return;
      }
      window.location.href = "/"; // middleware redireciona ao ambiente do usuário
    } catch (err: any) {
      setCarregando(false);
      console.error("[login] Falha de rede/config:", err);
      setErro(`Falha ao contatar o servidor de autenticação: ${err?.message ?? err}`);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-5">
      <form onSubmit={entrar} className="w-[420px] max-w-[96vw] bg-white border border-neutro-border rounded-2xl shadow-md p-8">
        <Image src="/brand/logo-maracas.png" alt="Prefeitura de Maracás" width={200} height={52} priority className="h-[52px] w-auto mx-auto mb-5" />
        <h1 className="text-center text-lg font-semibold">Bem-vindo(a)</h1>
        <p className="text-center text-neutro-text2 text-sm mb-5">Gestão de Demandas · Comunicação</p>
        <div className="mb-3">
          <label htmlFor="email" className="block text-[13px] font-semibold mb-1.5">E-mail</label>
          <input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)}
            className="w-full h-10 border border-neutro-border rounded-[10px] px-3 outline-none focus:border-marca-azul" placeholder="voce@maracas.ba.gov.br" />
        </div>
        <div className="mb-2">
          <label htmlFor="senha" className="block text-[13px] font-semibold mb-1.5">Senha</label>
          <input id="senha" type="password" required value={senha} onChange={e=>setSenha(e.target.value)}
            className="w-full h-10 border border-neutro-border rounded-[10px] px-3 outline-none focus:border-marca-azul" />
        </div>
        <div className="text-right mb-3"><a href="/recuperar" className="text-sm">Esqueci minha senha</a></div>
        {erro && <div role="alert" className="tone-vermelho rounded-[10px] px-3 py-2 text-sm mb-3">{erro}</div>}
        <Button type="submit" variant="primary" className="w-full justify-center" disabled={carregando}>
          {carregando ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
