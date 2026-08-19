"use client";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { NotifBell } from "@/components/interno/NotifBell";
import { UserMenu } from "@/components/interno/UserMenu";
import { ToastProvider } from "@/components/ui/Toast";
import { PageTransition } from "@/components/ui/PageTransition";
import { BuscaHeader } from "@/components/interno/BuscaHeader";
import { ThemeToggle } from "@/components/interno/ThemeToggle";
import { HelpDrawer } from "@/components/interno/HelpDrawer";

// Estrutura do ambiente interno (barra superior + menu + conteúdo). Botão ☰ abre o drawer no mobile.
export function AppShell({ atual, usuario, children }: {
  atual: string; usuario: { nome: string; cargo: string }; children: React.ReactNode;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <ToastProvider>
      <div className="flex h-screen">
        <Sidebar atual={atual} aberto={menu} onFechar={() => setMenu(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-[60px] bg-white/95 backdrop-blur border-b border-neutro-border flex items-center gap-3 px-4 flex-none z-20">
            <button className="w-10 h-10 rounded-[10px] hover:bg-neutro-surface2 pressable md:hidden" aria-label="Abrir menu" onClick={() => setMenu(true)}>☰</button>
            <BuscaHeader />
            <div className="flex-1" />
            <ThemeToggle />
            <HelpDrawer />
            <NotifBell />
            <UserMenu />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
