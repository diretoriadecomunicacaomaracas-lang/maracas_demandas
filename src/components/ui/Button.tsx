import { ButtonHTMLAttributes } from "react";
type Variant = "primary" | "secondary" | "ghost" | "danger";
export function Button({ variant = "secondary", className = "", ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base = "inline-flex items-center gap-2 h-10 px-4 rounded-md font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed";
  const styles: Record<Variant,string> = {
    primary: "bg-marca-azul text-white hover:brightness-95",
    secondary: "bg-white border border-neutro-border text-neutro-text hover:bg-neutro-surface2",
    ghost: "text-marca-azul hover:bg-[#E7F3FF]",
    danger: "bg-white border border-[#f3c7c3] text-[#B32219] hover:bg-[#FFE7E5]",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
