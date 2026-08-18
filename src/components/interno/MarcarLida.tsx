"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { marcarLida } from "@/server/data/notificacoes";
export function MarcarLida({ id }: { id: string }) {
  const [p, start] = useTransition();
  return <Button className="h-8 px-3 text-[13px]" disabled={p} onClick={() => start(() => marcarLida(id).then(() => {}))}>Marcar como lida</Button>;
}
