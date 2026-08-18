import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { eventosPlanejamento } from "@/server/data/planejamento";
import { CalendarioMes } from "@/components/interno/CalendarioMes";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Calendário compartilhado (toda a equipe visualiza). Alimentado pelo Planejamento.
// Somente leitura — a organização/edição acontece em /app/planejamento.
export default async function Calendario({ searchParams }: { searchParams: { ano?: string; mes?: string } }) {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  const hoje = new Date();
  const ano = Number(searchParams.ano ?? hoje.getFullYear());
  const mes = Number(searchParams.mes ?? hoje.getMonth());
  const de = new Date(ano, mes, 1).toISOString();
  const ate = new Date(ano, mes + 1, 0, 23, 59, 59).toISOString();
  const eventos = await eventosPlanejamento(de, ate);
  return (
    <AppShell atual="calendario" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="mb-4"><h1 className="text-[22px] font-bold">Calendário editorial</h1>
        <p className="text-neutro-text2 text-[13px]">Visão compartilhada da equipe · fuso America/Sao_Paulo · semana começa na segunda. Impressos não entram aqui.</p></div>
      <CalendarioMes eventos={eventos as any} ano={ano} mes={mes} basePath="/app/calendario" />
    </AppShell>
  );
}
