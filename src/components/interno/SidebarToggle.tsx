"use client";
import { useEffect, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";

// Recolher/expandir a Sidebar (desktop). Persiste em localStorage e no
// data-sidebar do <html> (definido no layout, sem flash).
export function SidebarToggle() {
  const [col, setCol] = useState(false);
  useEffect(() => { setCol(document.documentElement.dataset.sidebar === "collapsed"); }, []);
  function toggle() {
    const novo = !col;
    document.documentElement.dataset.sidebar = novo ? "collapsed" : "expanded";
    try { localStorage.setItem("sidebarCollapsed", novo ? "1" : "0"); } catch { /* ignore */ }
    setCol(novo);
  }
  return (
    <Tooltip label={col ? "Expandir menu" : "Recolher menu"}>
      <button onClick={toggle} aria-label={col ? "Expandir menu" : "Recolher menu"}
        className="w-8 h-8 grid place-items-center rounded-md hover:bg-neutro-surface2 pressable text-neutro-text2 hidden md:grid">
        {col ? "›" : "‹"}
      </button>
    </Tooltip>
  );
}
