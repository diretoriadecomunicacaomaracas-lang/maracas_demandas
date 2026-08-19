import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { listarGrupos, garantirGruposIniciais } from "@/server/data/chat";
import { ChatUI } from "@/components/interno/ChatUI";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Conversas({ searchParams }: { searchParams: { grupo?: string } }) {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  await garantirGruposIniciais(); // idempotente; só efetiva para Admin/Diretor
  const grupos = await listarGrupos();
  return (
    <AppShell atual="conversas" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="mb-4"><h1 className="text-[22px] font-bold">Bate-papo</h1>
        <p className="text-neutro-text2 text-[13px]">Grupos internos da equipe · use @nome para mencionar.</p></div>
      <ChatUI grupos0={grupos as any} meId={ator.id} grupoInicial={searchParams.grupo} />
    </AppShell>
  );
}
