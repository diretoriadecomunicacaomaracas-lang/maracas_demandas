import { AppShell } from "@/components/layout/AppShell";
import { exigirInterno } from "@/components/interno/GuardInterno";
import { createSupabaseServer } from "@/lib/supabase-server";
export default async function Arquivadas() {
  const ator = await exigirInterno();
  const sb = createSupabaseServer();
  const { data } = await sb.from("subdemandas").select("id,titulo,tipo").eq("situacao", "arquivada");
  return (
    <AppShell atual="arquivadas" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <h1 className="text-[22px] font-bold mb-4">Arquivadas</h1>
      <div className="bg-white border border-neutro-border rounded-2xl overflow-hidden max-w-[720px]">
        {(data ?? []).length === 0 && <div className="p-8 text-center text-neutro-text2">Nenhuma demanda arquivada.</div>}
        {(data ?? []).map((s: any) => <div key={s.id} className="p-4 border-b border-neutro-border font-semibold">{s.titulo} <span className="text-[12px] text-neutro-text2">· {s.tipo}</span></div>)}
      </div>
    </AppShell>
  );
}
