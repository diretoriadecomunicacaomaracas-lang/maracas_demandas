import { AppShell } from "@/components/layout/AppShell";
import { exigirInterno } from "@/components/interno/GuardInterno";
import { createSupabaseServer } from "@/lib/supabase-server";
import { StatusChip } from "@/components/ui/StatusChip";
import Link from "next/link";
export default async function Page() {
  const ator = await exigirInterno();
  const sb = createSupabaseServer();
  const { data } = await sb.from("subdemandas").select("id,titulo,tipo,etapa").eq("situacao","ativa").eq("tipo","impresso");
  return (
    <AppShell atual="impressos" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <h1 className="text-[22px] font-bold mb-4">Impressos</h1>
      <div className="bg-white border border-neutro-border rounded-2xl overflow-hidden max-w-[760px]">
        {(data ?? []).length === 0 && <div className="p-8 text-center text-neutro-text2">Nenhuma demanda deste tipo.</div>}
        {(data ?? []).map((s: any) => (
          <div key={s.id} className="flex items-center gap-3 p-4 border-b border-neutro-border">
            <Link href={`/app/demandas/${s.id}`} className="flex-1 font-semibold hover:text-marca-azul">{s.titulo}</Link>
            <StatusChip status={s.etapa} />
          </div>
        ))}
      </div>
    </AppShell>
  );
}
