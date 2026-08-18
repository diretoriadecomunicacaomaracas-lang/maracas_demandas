import Image from "next/image";
import { createSupabaseServer } from "@/lib/supabase-server";
import { StatusChip } from "@/components/ui/StatusChip";
import { PortalHeader } from "@/components/interno/PortalHeader";
import { dataBR } from "@/lib/dates";

// Portal da Gráfica — responsivo real, mobile-first (sem moldura de telefone). RLS: só pedidos atribuídos.
export default async function PortalGrafica() {
  const supabase = createSupabaseServer();
  const { data: pedidos } = await supabase
    .from("pedidos_impressao")
    .select("id,status,prazo,local_entrega,quantidade,formato,material")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-neutro-bg">
      <PortalHeader titulo="Portal da Gráfica" boxBrand />
      <main className="max-w-[720px] mx-auto p-4">
        <h1 className="text-[20px] font-bold mb-1">Meus pedidos</h1>
        <p className="text-[13px] text-neutro-text2 mb-4">Pedidos atribuídos à sua gráfica</p>
        {(pedidos ?? []).map((p) => (
          <a key={p.id} href={`/grafica/${p.id}`} className="block bg-white border border-neutro-border rounded-xl p-4 mb-3 shadow-sm">
            <div className="flex items-center justify-between">
              <b>{p.id.slice(0, 8)}</b><StatusChip status={p.status} />
            </div>
            <div className="text-[13px] text-neutro-text2 mt-1">{p.quantidade} · {p.formato} · {p.material}</div>
            <div className="text-[13px] text-neutro-text2">Prazo: {p.prazo ? dataBR(p.prazo) : "—"} · Entrega: {p.local_entrega ?? "—"}</div>
          </a>
        ))}
        {(!pedidos || pedidos.length === 0) && (
          <div className="bg-white border border-neutro-border rounded-xl p-8 text-center text-neutro-text2">Nenhum pedido atribuído.</div>
        )}
      </main>
    </div>
  );
}
