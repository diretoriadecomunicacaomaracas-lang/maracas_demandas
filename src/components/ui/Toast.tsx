"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";

type Tipo = "sucesso" | "erro" | "info";
type Toast = { id: number; tipo: Tipo; msg: string };
type Ctx = { toast: (msg: string, tipo?: Tipo) => void; sucesso: (m: string) => void; erro: (m: string) => void };

const ToastCtx = createContext<Ctx | null>(null);
const TOM: Record<Tipo, string> = { sucesso: "tone-verde", erro: "tone-vermelho", info: "tone-azul" };
const ICONE: Record<Tipo, string> = { sucesso: "✓", erro: "!", info: "i" };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<Toast[]>([]);
  const seq = useRef(0);
  const remover = useCallback((id: number) => setItens((l) => l.filter((t) => t.id !== id)), []);
  const toast = useCallback((msg: string, tipo: Tipo = "info") => {
    const id = ++seq.current;
    setItens((l) => [...l, { id, tipo, msg }]);
    setTimeout(() => remover(id), 4200);
  }, [remover]);
  const value: Ctx = {
    toast,
    sucesso: useCallback((m: string) => toast(m, "sucesso"), [toast]),
    erro: useCallback((m: string) => toast(m, "erro"), [toast]),
  };
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed z-[60] right-4 bottom-4 flex flex-col gap-2 max-w-[92vw] w-[360px]" aria-live="polite" aria-atomic="false">
        {itens.map((t) => (
          <div key={t.id} role={t.tipo === "erro" ? "alert" : "status"}
            className={`anim-in flex items-start gap-2.5 rounded-[12px] px-3.5 py-3 shadow-md ${TOM[t.tipo]}`}>
            <span aria-hidden className="mt-0.5 w-5 h-5 grid place-items-center rounded-full bg-current text-white font-bold text-[12px]">{ICONE[t.tipo]}</span>
            <div className="flex-1 text-[13.5px] leading-snug">{t.msg}</div>
            <button onClick={() => remover(t.id)} aria-label="Fechar aviso" className="opacity-70 hover:opacity-100 pressable">✕</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): Ctx {
  const c = useContext(ToastCtx);
  if (!c) throw new Error("useToast precisa de <ToastProvider>.");
  return c;
}
