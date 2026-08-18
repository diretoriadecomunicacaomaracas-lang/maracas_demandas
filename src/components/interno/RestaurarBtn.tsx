"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { restaurarSubdemanda } from "@/server/data/demandas";

export function RestaurarBtn({ subId }: { subId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button disabled={pending} onClick={() => start(async () => { const r = await restaurarSubdemanda(subId); if (r.ok) router.refresh(); })}
      className="text-[13px] font-semibold text-marca-azul hover:underline pressable disabled:opacity-60">{pending ? "Restaurando…" : "Restaurar"}</button>
  );
}
