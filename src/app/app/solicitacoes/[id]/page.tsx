import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { getSolicitacaoCompleta } from "@/server/data/solicitacoes";
import { listarInternos } from "@/server/data/usuarios";
import { TriagemDetalhe } from "@/components/interno/TriagemDetalhe";
import { redirect, notFound } from "next/navigation";

export default async function TriagemPage({ params }: { params: { id: string } }) {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  const s = await getSolicitacaoCompleta(params.id); if (!s) notFound();
  const internos = await listarInternos();
  return (
    <AppShell atual="solicitacoes" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <TriagemDetalhe s={s as any} internos={internos as any} />
    </AppShell>
  );
}
