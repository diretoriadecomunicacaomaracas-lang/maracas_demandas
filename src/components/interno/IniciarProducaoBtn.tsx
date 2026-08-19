"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { iniciarProducao } from "@/server/data/planejamento";

// Aparece quando a tarefa está "Aguardando distribuição" (planejada + atribuída).
export function IniciarProducaoBtn({ subId, etapa, tipo, temResponsavel }: { subId: string; etapa: string; tipo: string; temResponsavel: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const aguardando = etapa === "distribuicao" || (tipo === "audiovisual" && etapa === "planejamento" && temResponsavel);
  if (!aguardando) return null;
  return (
    <Button variant="primary" disabled={pending}
      onClick={() => start(async () => { const r = await iniciarProducao(subId); if (r.ok) router.refresh(); })}>
      {pending ? "Iniciando…" : "▶ Iniciar produção"}
    </Button>
  );
}
