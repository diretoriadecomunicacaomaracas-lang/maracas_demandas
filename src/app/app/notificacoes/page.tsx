import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { minhasNotificacoes } from "@/server/data/notificacoes";
import { MarcarLida } from "@/components/interno/MarcarLida";
import { BackButton } from "@/components/interno/BackButton";
import { redirect } from "next/navigation";

export default async function Notificacoes() {
  const ator = await getAtor(); if (!ator) redirect("/login"); if (ator.ambiente !== "interno") redirect("/");
  const lista = await minhasNotificacoes();
  return (
    <AppShell atual="painel" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="flex items-center gap-3 mb-3"><BackButton fallback="/app/painel" /></div>
      <h1 className="text-[22px] font-bold mb-4">Notificações</h1>
      <div className="bg-white border border-neutro-border rounded-2xl overflow-hidden max-w-[720px]">
        {lista.length === 0 && <div className="p-8 text-center text-neutro-text2">Sem notificações.</div>}
        {lista.map((n: any) => (
          <div key={n.id} className={`flex items-center gap-3 p-4 border-b border-neutro-border ${n.lida ? "" : "bg-[#E7F3FF]"}`}>
            <div className="flex-1"><div className="text-[13.5px]">{n.titulo}</div>
              <div className="text-[12px] text-neutro-text2">{new Date(n.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</div></div>
            {!n.lida && <MarcarLida id={n.id} />}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
