import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { indicadoresPainel } from "@/server/data/painel";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Painel() {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  const k = await indicadoresPainel();
  const cards: [string, number, string][] = [
    ["Novas solicitações", k.novas, "/app/solicitacoes"], ["Demandas em andamento", k.andamento, "/app/demandas"],
    ["Aguardando aprovação", k.aprovacao, "/app/demandas"], ["Atrasadas", k.atrasadas, "/app/demandas"],
    ["Publicações hoje", k.pubHoje, "/app/calendario"], ["Publicações próx. 7 dias", k.pub7, "/app/calendario"],
    ["Impressos aguardando aprovação", k.impAprov, "/app/impressos"], ["Impressos em produção", k.impProd, "/app/impressos"],
  ];
  return (
    <AppShell atual="painel" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="mb-4"><h1 className="text-[22px] font-bold">Painel principal</h1>
        <p className="text-neutro-text2 text-[13px]">Indicadores reais · horário de Brasília (America/Sao_Paulo)</p></div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))" }}>
        {cards.map(([lab, val, href]) => (
          <Link key={lab} href={href} className="bg-white border border-neutro-border rounded-lg shadow-sm p-4 hover:bg-neutro-surface2">
            <div className="text-[13px] text-neutro-text2">{lab}</div>
            <div className="text-[26px] font-extrabold">{val}</div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
