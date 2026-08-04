import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Gestão de Demandas — Comunicação · Prefeitura de Maracás",
  description: "Sistema de Gestão de Demandas da Comunicação da Prefeitura de Maracás/BA",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="pt-BR"><body>{children}</body></html>);
}
