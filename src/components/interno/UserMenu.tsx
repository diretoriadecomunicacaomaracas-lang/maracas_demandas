"use client";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { getMe } from "@/server/data/me";
import { Avatar } from "@/components/ui/Avatar";

// Menu do usuário (todos os ambientes): mostra quem está logado e permite Sair → /login.
export function UserMenu() {
  const [me, setMe] = useState<{ nome: string; email: string; funcao: string; avatarUrl: string | null } | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { getMe().then((m) => setMe(m as any)); }, []);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc); return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  async function sair() {
    try { await createSupabaseBrowser().auth.signOut(); } catch {}
    window.location.href = "/login";
  }
  if (!me) return <span className="w-8 h-8 rounded-full bg-neutro-surface2 inline-block" aria-hidden />;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
        className="flex items-center gap-2 px-1.5 py-1 rounded-[10px] hover:bg-neutro-surface2">
        <Avatar nome={me.nome} url={me.avatarUrl} size={30} />
        <span className="leading-tight text-left hidden sm:block">
          <span className="block text-[13px] font-semibold">{me.nome}</span>
          <span className="block text-[11px] text-neutro-text2">{me.funcao}</span>
        </span>
        <span className="text-neutro-text2 text-[11px]">▾</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 bg-white border border-neutro-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b border-neutro-border flex items-center gap-3">
            <Avatar nome={me.nome} url={me.avatarUrl} size={38} />
            <div><div className="text-[14px] font-semibold">{me.nome}</div><div className="text-[12px] text-neutro-text2">{me.email}</div><div className="text-[11px] text-neutro-text3">{me.funcao}</div></div>
          </div>
          <div className="p-1">
            <div className="px-3 py-2 text-[12px] text-neutro-text2">Fuso: America/Sao_Paulo · Idioma: pt-BR</div>
            <button role="menuitem" onClick={sair} className="w-full text-left px-3 py-2 rounded-lg text-[13px] font-semibold text-[#B32219] hover:bg-[#FFE7E5]">Sair da conta</button>
          </div>
        </div>
      )}
    </div>
  );
}
