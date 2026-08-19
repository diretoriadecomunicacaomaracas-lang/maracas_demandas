import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { getMe } from "@/server/data/me";
import { createSupabaseServer } from "@/lib/supabase-server";
import { BackButton } from "@/components/interno/BackButton";
import { PerfilForm } from "@/components/interno/PerfilForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const ator = await getAtor(); if (!ator) redirect("/login");
  const me = await getMe();
  const sb = createSupabaseServer();
  let secretaria: string | null = null, unidade: string | null = null, grupos: string[] = [];
  if (ator.secretariaId) { const { data } = await sb.from("secretarias").select("nome").eq("id", ator.secretariaId).maybeSingle(); secretaria = data?.nome ?? null; }
  if (ator.unidadeId) { const { data } = await sb.from("unidades").select("nome").eq("id", ator.unidadeId).maybeSingle(); unidade = data?.nome ?? null; }
  if (ator.ambiente === "interno") { const { data } = await sb.from("grupo_membros").select("grupos_conversa(nome)").eq("usuario_id", ator.id); grupos = (data ?? []).map((g: any) => g.grupos_conversa?.nome).filter(Boolean); }

  const Info = ({ k, v }: { k: string; v: string }) => (
    <div className="flex gap-2 py-2 border-b border-dashed border-neutro-border text-[13px]"><div className="w-40 text-neutro-text2">{k}</div><div className="font-medium">{v}</div></div>
  );

  return (
    <AppShell atual="" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="flex items-center gap-3 mb-4"><BackButton fallback="/app/painel" /><h1 className="text-[22px] font-bold">Meu perfil</h1></div>
      <div className="grid gap-4 items-start" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
        <PerfilForm id={ator.id} nome0={ator.nome} avatar0={me?.avatarUrl ?? null} />
        <div className="card card-pad max-w-[560px]">
          <h2 className="font-bold text-[15px] mb-2">Informações</h2>
          <Info k="E-mail" v={ator.email} />
          <Info k="Tipo de acesso" v={ator.ambiente === "solicitante" ? "Solicitante" : ator.ambiente === "grafica" ? "Gráfica" : "Equipe interna"} />
          <Info k="Função" v={me?.funcao ?? "—"} />
          {ator.ambiente === "solicitante" && <><Info k="Secretaria" v={secretaria ?? "—"} /><Info k="Setor/Unidade" v={unidade ?? "—"} /></>}
          {ator.ambiente === "interno" && grupos.length > 0 && <Info k="Grupos" v={grupos.join(", ")} />}
          <p className="text-[12px] text-neutro-text3 mt-3">Cargo, função, permissões, secretaria e grupos são administrados pela Administração.</p>
        </div>
      </div>
    </AppShell>
  );
}
