"use client";
import { useEffect, useState } from "react";
import { lerTema, temaEfetivo, aplicarTema } from "@/lib/tema";
import { Tooltip } from "@/components/ui/Tooltip";

// Botão compacto de tema no header (Sol/Lua). Alterna claro↔escuro.
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(temaEfetivo(lerTema()) === "dark"); }, []);
  function alternar() { const novo = dark ? "claro" : "escuro"; aplicarTema(novo); setDark(!dark); }
  return (
    <Tooltip label="Alternar tema">
      <button onClick={alternar} aria-label="Alternar tema"
        className="w-10 h-10 rounded-[10px] hover:bg-neutro-surface2 pressable grid place-items-center text-[16px]">
        {dark ? "☀️" : "🌙"}
      </button>
    </Tooltip>
  );
}
