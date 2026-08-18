import { getAtor } from "@/server/context";
import { unidadesDaSecretaria } from "@/server/data/unidades";
import { NovaSolicitacaoForm } from "@/components/interno/NovaSolicitacaoForm";
import { redirect } from "next/navigation";

export default async function NovaSolicitacao() {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "solicitante") redirect("/");
  const unidades = ator.secretariaId ? await unidadesDaSecretaria(ator.secretariaId) : [];
  return <NovaSolicitacaoForm unidades={unidades as any} setorPadrao={ator.unidadeId ?? ""} />;
}
