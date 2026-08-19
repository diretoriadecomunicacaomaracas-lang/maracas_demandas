"use client";
// Utilidades de tema (claro/escuro/sistema) persistidas em localStorage.
export type Tema = "claro" | "escuro" | "sistema";

export function lerTema(): Tema {
  if (typeof localStorage === "undefined") return "sistema";
  return (localStorage.getItem("tema") as Tema) || "sistema";
}
export function temaEfetivo(t: Tema): "light" | "dark" {
  if (t === "escuro") return "dark";
  if (t === "claro") return "light";
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
export function aplicarTema(t: Tema) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = temaEfetivo(t);
  try { localStorage.setItem("tema", t); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent("tema-mudou", { detail: t }));
}
