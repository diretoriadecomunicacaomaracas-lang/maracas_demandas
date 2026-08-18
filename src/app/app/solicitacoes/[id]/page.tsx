import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { getSolicitacaoCompleta, registrarInicioAnalise } from "@/server/data/solicitacoes";
import { listarInternos } from "@/server/data/usuarios";
import { TriagemDetalhe } from "@/components/interno/TriagemDetalhe";
import { can } from "@/lib/permissions";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TriagemPage({ params, searchParams }: { params: { id: string }; searchParams: { analisar?: string } }) {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  if (searchParams.analisar) await registrarInicioAnalise(params.id); // botão "Analisar" registra início
  const s = await getSolicitacaoCompleta(params.id); if (!s) notFound();
  const internos = await listarInternos();
  return (
    <AppShell atual="solicitacoes" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <TriagemDetalhe s={s as any} internos={internos as any}
        podeInterna={can(ator.cargos, "moderar_conversa")} ambienteAtor={ator.ambiente} />
    </AppShell>
  );
}
