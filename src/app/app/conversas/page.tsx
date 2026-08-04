import { AppShell } from "@/components/layout/AppShell";
import { exigirInterno } from "@/components/interno/GuardInterno";
import { createSupabaseServer } from "@/lib/supabase-server";
export default async function Conversas() {
  const ator = await exigirInterno();
  const sb = createSupabaseServer();
  const { data: grupos } = await sb.from("grupos_conversa").select("id,nome").order("nome"); // RLS: só membros
  return (
    <AppShell atual="conversas" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <h1 className="text-[22px] font-bold mb-4">Conversas</h1>
      <div className="flex gap-4">
        <div className="w-64 bg-white border border-neutro-border rounded-xl overflow-hidden">
          {(grupos ?? []).map((g: any) => <div key={g.id} className="flex items-center gap-2 p-3 border-b border-neutro-border"><span className="w-7 h-7 rounded-full bg-marca-azul text-white grid place-items-center">#</span><b className="text-[13.5px]">{g.nome}</b></div>)}
          {(grupos ?? []).length === 0 && <div className="p-6 text-center text-neutro-text2 text-[13px]">Você ainda não participa de grupos.</div>}
        </div>
        <div className="flex-1 bg-white border border-neutro-border rounded-xl p-6 text-neutro-text2 text-[13px]">
          Selecione um grupo para ver as mensagens. Envio, menções, não lidas e pesquisa já estão implementados na camada de serviços; a tela de mensagens em tempo real (Supabase Realtime) é o próximo incremento do wiring.
        </div>
      </div>
    </AppShell>
  );
}
