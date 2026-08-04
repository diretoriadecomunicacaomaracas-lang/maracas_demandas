import Image from "next/image";
import { getAtor } from "@/server/context";
import { createSupabaseServer } from "@/lib/supabase-server";
import { GraficaAcoes } from "@/components/interno/GraficaAcoes";
import { PortalHeader } from "@/components/interno/PortalHeader";
import { redirect, notFound } from "next/navigation";
import { dataBR } from "@/lib/dates";

export default async function PedidoGrafica({ params }: { params: { id: string } }) {
  const ator = await getAtor(); if (!ator) redirect("/login");
  if (ator.ambiente !== "grafica") redirect("/");
  const sb = createSupabaseServer();
  const { data: ped } = await sb.from("pedidos_impressao").select("*").eq("id", params.id).maybeSingle(); // RLS: só se atribuído
  if (!ped) notFound();
  const { data: versao } = ped.versao_liberada_id ? await sb.from("versoes").select("numero,link_drive,estado").eq("id", ped.versao_liberada_id).maybeSingle() : { data: null };
  return (
    <div className="min-h-screen bg-neutro-bg">
      <PortalHeader titulo="Portal da Gráfica" boxBrand />
      <main className="max-w-[720px] mx-auto p-4">
        <a href="/grafica" className="text-[13px] font-semibold">← Voltar aos pedidos</a>
        <h1 className="text-[18px] font-bold mt-2 mb-3">Pedido de impressão</h1>
        <div className="bg-white border border-neutro-border rounded-xl p-4 mb-3 text-[13.5px]">
          <Row k="Quantidade" v={ped.quantidade} /><Row k="Medidas" v={ped.medidas} /><Row k="Formato" v={ped.formato} />
          <Row k="Material" v={ped.material} /><Row k="Acabamento" v={ped.acabamento} /><Row k="Prazo" v={ped.prazo ? dataBR(ped.prazo) : "—"} /><Row k="Entrega" v={ped.local_entrega} />
        </div>
        <div className="bg-white border border-neutro-border rounded-xl p-4 mb-3">
          <b>Versão liberada</b>
          {versao ? <div className="mt-2"><span className="text-[11px] bg-neutro-surface2 border border-neutro-border rounded px-2 py-0.5">V{versao.numero}</span> <a href={versao.link_drive} target="_blank" rel="noreferrer">🔗 abrir arquivo liberado</a></div>
            : <p className="text-[13px] text-neutro-text2 mt-2">Aguardando liberação da Comunicação.</p>}
        </div>
        <GraficaAcoes pedidoId={ped.id} temVersao={!!ped.versao_liberada_id} status={ped.status} />
      </main>
    </div>
  );
}
function Row({ k, v }: { k: string; v: any }) { return <div className="flex gap-2 py-1.5 border-b border-dashed border-neutro-border"><div className="w-36 text-neutro-text2">{k}</div><div className="font-medium">{v ?? "—"}</div></div>; }
