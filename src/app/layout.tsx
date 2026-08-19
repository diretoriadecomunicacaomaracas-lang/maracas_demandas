import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Gestão de Demandas — Comunicação · Prefeitura de Maracás",
  description: "Sistema de Gestão de Demandas da Comunicação da Prefeitura de Maracás/BA",
};
// Aplica o tema ANTES da pintura (evita flash branco). 'sistema' segue prefers-color-scheme.
const themeScript = `(function(){try{var t=localStorage.getItem('tema')||'sistema';var d=t==='escuro'||(t==='sistema'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.dataset.sidebar=localStorage.getItem('sidebarCollapsed')==='1'?'collapsed':'expanded';}catch(e){}})();`;
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
