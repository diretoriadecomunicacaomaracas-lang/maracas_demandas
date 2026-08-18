"use client";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const ITENS = [
  ["painel","Painel","◱"],["solicitacoes","Solicitações","✉"],["planejamento","Planejamento","🗓"],["demandas","Demandas","▤"],
  ["criacao","Criação","✎"],["audiovisual","Audiovisual","▷"],["impressos","Impressos","🖶"],
  ["calendario","Calendário","▦"],["conversas","Conversas","💬"],["arquivadas","Arquivadas","🗀"],
  ["lixeira","Lixeira","🗑"],["admin","Administração","⚙"],
] as const;

// Menu lateral: desktop fixo; mobile em drawer com overlay, foco e bloqueio de rolagem.
export function Sidebar({ atual, aberto, onFechar }:{ atual:string; aberto:boolean; onFechar:()=>void; }) {
  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = "hidden";
      const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onFechar(); };
      window.addEventListener("keydown", onEsc);
      return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onEsc); };
    }
  }, [aberto, onFechar]);

  return (
    <>
      {aberto && <div className="fixed inset-0 bg-black/40 z-30 md:hidden anim-fade" onClick={onFechar} aria-hidden />}
      <aside
        className={`bg-white border-r border-neutro-border w-64 flex-none flex flex-col z-40
          fixed inset-y-0 left-0 -translate-x-full transition-transform duration-200
          md:static md:translate-x-0 ${aberto ? "translate-x-0" : ""}`}
        aria-label="Menu principal" role="navigation"
      >
        {/* Logomarca = atalho para o Painel Principal (acessível por teclado, com tooltip) */}
        <div className="h-[60px] flex items-center px-4 border-b border-neutro-border">
          <Link href="/app/painel" onClick={onFechar} title="Voltar ao Painel Principal"
            aria-label="Voltar ao Painel Principal"
            className="group inline-flex items-center rounded-[10px] px-1.5 py-1 -mx-1.5 cursor-pointer
              hover:bg-neutro-surface2 transition pressable focus-visible:outline-2">
            <Image src="/brand/logo-maracas.png" alt="Prefeitura de Maracás" width={150} height={40} priority
              className="h-[26px] w-auto transition-transform group-hover:scale-[1.02]" />
          </Link>
        </div>
        <nav className="p-2 flex-1 overflow-auto">
          <div className="text-[11px] font-bold uppercase tracking-wide text-neutro-text3 px-3 pt-3 pb-1.5">Conteúdo</div>
          {ITENS.map(([key,label,ic]) => {
            const ativo = atual === key;
            return (
              <a key={key} href={`/app/${key}`} aria-current={ativo ? "page" : undefined}
                className={`relative flex items-center gap-3 h-10 px-3 my-0.5 rounded-[10px] text-sm transition-colors pressable
                  ${ativo ? "bg-[#E7F3FF] text-marca-azul font-semibold" : "text-neutro-text2 hover:bg-neutro-surface2 hover:text-neutro-text"}`}>
                {ativo && <span aria-hidden className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-marca-azul" />}
                <span aria-hidden className="w-5 text-center">{ic}</span>{label}
              </a>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
