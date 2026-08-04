import Image from "next/image";
import { getAtor } from "@/server/context";
import { createSupabaseServer } from "@/lib/supabase-server";
import { MensagensSolic } from "@/components/interno/MensagensSolic";
import { redirect, notFound } from "next/navigation";
import { dataHoraBR } from "@/lib/dates";

export default async function DetalheSolic({ params }: { params: { id: string } }) {
  const ator = await getAtor(); if (!ator) redirect("/login");
  const sb = createSupabaseServer();
  const { data: s } = await sb.from("solicitacoes").select("*").eq("id", params.id).maybeSingle(); // RLS aplica
  if (!s) notFound();
  const { data: msgs } = await sb.from("solicitacao_mensagens").select("*").eq("solicitacao_id", params.id).order("created_at");
  const { data: sec } = s.secretaria_id ? await sb.from("secretarias").select("nome").eq("id", s.secretaria_id).maybeSingle() : { data: null };
  const { data: uni } = s.unidade_id ? await sb.from("unidades").select("nome").eq("id", s.unidade_id).maybeSingle() : { data: null };
  return (
    <div className="min-h-screen bg-neutro-bg">
      <header className="h-16 bg-white border-b border-neutro-border flex items-center gap-3 px-5">
        <Image src="/brand/logo-maracas.png" alt="Prefeitura de Maracás" width={160} height={30} className="h-[30px] w-auto" />
        <b>Solicitação {s.protocolo}</b><a href="/portal" className="ml-auto text-[13px]">← Voltar</a>
      </header>
      <main className="max-w-[720px] mx-auto p-5">
        <h1 className="text-[22px] font-bold">{s.titulo}</h1>
        <p className="text-neutro-text2 text-[13px] mb-3">Enviada em {dataHoraBR(s.created_at)} · Status: {s.status_externo}</p>
        <div className="bg-white border border-neutro-border rounded-xl p-4 mb-3 text-[13.5px]">
          <div className="flex gap-2 py-1.5"><div className="w-32 text-neutro-text2">Secretaria</div><div>{sec?.nome ?? "—"}</div></div>
          <div className="flex gap-2 py-1.5"><div className="w-32 text-neutro-text2">Setor</div><div>{uni?.nome ?? "—"}</div></div>
          <div className="flex gap-2 py-1.5"><div className="w-32 text-neutro-text2">Tipo</div><div>{s.tipo ?? "—"}</div></div>
          <div className="flex gap-2 py-1.5"><div className="w-32 text-neutro-text2">Prazo desejado</div><div>{s.prazo_desejado ? dataHoraBR(s.prazo_desejado) : "—"}</div></div>
        </div>
        <div className="bg-white border border-neutro-border rounded-xl p-4">
          <b>Mensagens com a Comunicação</b>
          <MensagensSolic solicId={params.id} mensagens={(msgs ?? []) as any} />
        </div>
      </main>
    </div>
  );
}
