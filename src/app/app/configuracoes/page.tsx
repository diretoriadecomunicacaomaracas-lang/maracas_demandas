import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { BackButton } from "@/components/interno/BackButton";
import { ConfigForm } from "@/components/interno/ConfigForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const ator = await getAtor(); if (!ator) redirect("/login");
  return (
    <AppShell atual="" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="flex items-center gap-3 mb-4"><BackButton fallback="/app/painel" /><h1 className="text-[22px] font-bold">Configurações</h1></div>
      <ConfigForm email={ator.email} />
    </AppShell>
  );
}
