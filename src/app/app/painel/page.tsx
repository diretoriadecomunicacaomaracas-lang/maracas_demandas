import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { indicadoresPainel } from "@/server/data/painel";
import { StatTile } from "@/components/ui/StatTile";
import { redirect } from "next/navigation";

type Tom = "azul" | "verde" | "amarelo" | "laranja" | "vermelho" | "ciano" | "neutro";

export default async function Painel() {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  const k = await indicadoresPainel();
  const cards: [string, number, string, Tom][] = [
    ["Novas solicitações", k.novas, "/app/solicitacoes", "azul"],
    ["Demandas em andamento", k.andamento, "/app/demandas", "ciano"],
    ["Aguardando aprovação", k.aprovacao, "/app/demandas", "amarelo"],
    ["Atrasadas", k.atrasadas, "/app/demandas", "vermelho"],
    ["Publicações hoje", k.pubHoje, "/app/calendario", "verde"],
    ["Publicações próx. 7 dias", k.pub7, "/app/calendario", "verde"],
    ["Impressos aguardando aprovação", k.impAprov, "/app/impressos", "laranja"],
    ["Impressos em produção", k.impProd, "/app/impressos", "laranja"],
  ];
  return (
    <AppShell atual="painel" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="mb-4">
        <h1 className="text-[22px] font-bold">Painel principal</h1>
        <p className="text-neutro-text2 text-[13px]">Indicadores reais · horário de Brasília (America/Sao_Paulo)</p>
      </div>
      <div className="grid gap-4 stagger" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))" }}>
        {cards.map(([lab, val, href, tom]) => (
          <StatTile key={lab} label={lab} valor={val} href={href} tom={tom} />
        ))}
      </div>
    </AppShell>
  );
}
