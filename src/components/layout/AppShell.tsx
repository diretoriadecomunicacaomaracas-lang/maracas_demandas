"use client";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { NotifBell } from "@/components/interno/NotifBell";
import { UserMenu } from "@/components/interno/UserMenu";

// Estrutura do ambiente interno (barra superior + menu + conteúdo). Botão ☰ abre o drawer no mobile.
export function AppShell({ atual, usuario, children }:{
  atual: string; usuario: { nome: string; cargo: string }; children: React.ReactNode;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <div className="flex h-screen">
      <Sidebar atual={atual} aberto={menu} onFechar={() => setMenu(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[60px] bg-white border-b border-neutro-border flex items-center gap-3 px-4 flex-none">
          <button className="w-10 h-10 rounded-[10px] hover:bg-neutro-surface2 md:hidden" aria-label="Abrir menu" onClick={() => setMenu(true)}>☰</button>
          <label className="sr-only" htmlFor="busca">Pesquisar</label>
          <div className="flex-1 max-w-[520px] h-10 bg-neutro-surface2 border border-neutro-border rounded-[10px] flex items-center gap-2 px-3 text-neutro-text3">
            🔎<input id="busca" className="flex-1 bg-transparent outline-none text-neutro-text" placeholder="Pesquise o que quiser…" />
          </div>
          <div className="flex-1" />
          <NotifBell />
          <button className="w-10 h-10 rounded-[10px] hover:bg-neutro-surface2" aria-label="Ajuda">?</button>
          <UserMenu />
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
