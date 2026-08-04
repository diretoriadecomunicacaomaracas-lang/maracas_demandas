import { AppShell } from "@/components/layout/AppShell";
import { exigirInterno } from "@/components/interno/GuardInterno";
import { createSupabaseServer } from "@/lib/supabase-server";
import { dataHoraBR } from "@/lib/dates";
export default async function Calendario() {
  const ator = await exigirInterno();
  const sb = createSupabaseServer();
  const { data } = await sb.from("eventos_calendario").select("id,titulo,inicio,canal,subdemanda_id").order("inicio").limit(60);
  return (
    <AppShell atual="calendario" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <h1 className="text-[22px] font-bold mb-1">Calendário editorial</h1>
      <p className="text-neutro-text2 text-[13px] mb-4">Fuso America/Sao_Paulo · DD/MM/AAAA · 24h</p>
      <div className="bg-white border border-neutro-border rounded-2xl overflow-hidden max-w-[760px]">
        {(data ?? []).length === 0 && <div className="p-8 text-center text-neutro-text2">Sem eventos. Eventos aparecem ao programar publicações nas demandas.</div>}
        {(data ?? []).map((e: any) => (
          <a key={e.id} href={e.subdemanda_id ? `/app/demandas/${e.subdemanda_id}` : "#"} className="flex items-center gap-3 p-4 border-b border-neutro-border hover:bg-neutro-surface2">
            <div className="w-40 text-[13px]">{dataHoraBR(e.inicio)}</div>
            <div className="flex-1 font-semibold">{e.titulo}</div>
            <span className="text-[12px] text-neutro-text2">{e.canal ?? ""}</span>
          </a>
        ))}
      </div>
    </AppShell>
  );
}
