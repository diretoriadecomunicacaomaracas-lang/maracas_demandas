import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { listarSubdemandasComEquipe } from "@/server/data/demandas";
import { PainelArea } from "@/components/interno/paineis/PainelArea";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AudiovisualPage() {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  const subs = await listarSubdemandasComEquipe();
  return (
    <AppShell atual="audiovisual" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="mb-4"><h1 className="text-[22px] font-bold">Audiovisual</h1>
        <p className="text-neutro-text2 text-[13px]">Gravações, edição e publicação — carga por profissional.</p></div>
      <PainelArea subs={subs as any} tipo="audiovisual" meId={ator.id} />
    </AppShell>
  );
}
