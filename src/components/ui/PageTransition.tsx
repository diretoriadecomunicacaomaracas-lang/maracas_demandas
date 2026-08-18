"use client";
import { usePathname } from "next/navigation";

// Transição suave ao trocar de página (fade + slide). Anulada por reduced-motion (globals.css).
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <div key={pathname} className="anim-page">{children}</div>;
}
