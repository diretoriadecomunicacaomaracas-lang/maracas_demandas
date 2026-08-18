import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { listarLixeira } from "@/server/data/demandas";
import { EmptyState } from "@/components/ui/EmptyState";
import { RestaurarBtn } from "@/components/interno/RestaurarBtn";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LixeiraPage() {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "interno") redirect("/");
  const podeRestaurar = can(ator.cargos, "excluir_logico");
  const itens = await listarLixeira();
  return (
    <AppShell atual="lixeira" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="mb-4"><h1 className="text-[22px] font-bold">Lixeira</h1>
        <p className="text-neutro-text2 text-[13px]">Demandas excluídas logicamente. Nada é apagado fisicamente — histórico, links e versões preservados.</p></div>
      {(itens as any[]).length === 0 ? (
        <EmptyState icone="🗑" titulo="Lixeira vazia" descricao="Nenhuma demanda excluída." />
      ) : (
        <div className="card overflow-x-auto anim-in">
          <table className="w-full text-[13.5px] min-w-[720px]">
            <thead><tr className="bg-neutro-surface2 text-left text-[11px] uppercase text-neutro-text2">
              <th className="p-3">Elemento</th><th className="p-3">Tipo</th><th className="p-3">Excluído por</th><th className="p-3">Motivo</th><th className="p-3">Quando</th><th className="p-3"></th></tr></thead>
            <tbody>{(itens as any[]).map((s) => (
              <tr key={s.id} className="border-t border-neutro-border">
                <td className="p-3 font-semibold">{s.titulo}</td>
                <td className="p-3 capitalize">{s.tipo}</td>
                <td className="p-3">{s.excluidoPor}</td>
                <td className="p-3 text-neutro-text2">{s.motivo}</td>
                <td className="p-3">{s.quando ? new Date(s.quando).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"}</td>
                <td className="p-3">{podeRestaurar && <RestaurarBtn subId={s.id} />}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
