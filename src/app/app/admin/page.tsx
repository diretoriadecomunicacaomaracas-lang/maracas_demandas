import { AppShell } from "@/components/layout/AppShell";
import { getAtor } from "@/server/context";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { can } from "@/lib/permissions";
import { AdminPanel } from "@/components/interno/AdminPanel";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const ator = await getAtor(); if (!ator) redirect("/login");
  // Segurança de rota (além do menu): só quem administra usuários entra.
  if (!can(ator.cargos, "administrar_usuarios")) redirect("/app/painel");

  const admin = createSupabaseAdmin();
  const [{ data: usuarios }, { data: secretarias }, { data: unidades }, { data: graficas }, { data: grupos }, { data: membros }, { data: cargos }] = await Promise.all([
    admin.from("usuarios").select("id,nome,email,situacao,ambiente_principal,secretaria_id,unidade_id").is("deleted_at", null).order("nome"),
    admin.from("secretarias").select("id,nome,deleted_at").order("nome"),
    admin.from("unidades").select("id,nome,secretaria_id,deleted_at").order("nome"),
    admin.from("graficas").select("id,nome,contato_email,ativa").order("nome"),
    admin.from("grupos_conversa").select("id,nome,descricao,arquivado").order("nome"),
    admin.from("grupo_membros").select("grupo_id,usuario_id"),
    admin.from("cargos").select("chave,nome").order("nome"),
  ]);
  const mSec = new Map((secretarias ?? []).map((s: any) => [s.id, s.nome] as [string, string]));
  const unidadesEnr = (unidades ?? []).map((u: any) => ({ ...u, secretariaNome: mSec.get(u.secretaria_id) ?? "—" }));
  const gruposEnr = (grupos ?? []).map((g: any) => { const ms = (membros ?? []).filter((m: any) => m.grupo_id === g.id).map((m: any) => m.usuario_id); return { ...g, nMembros: ms.length, membros: ms }; });
  const internos = (usuarios ?? []).filter((u: any) => u.ambiente_principal === "interno").map((u: any) => ({ id: u.id, nome: u.nome }));

  return (
    <AppShell atual="admin" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <div className="mb-4"><h1 className="text-[22px] font-bold">Administração</h1>
        <p className="text-neutro-text2 text-[13px]">Equipe, secretarias, setores, gráficas e grupos. Ações ficam registradas em auditoria.</p></div>
      <AdminPanel usuarios={usuarios ?? []} secretarias={secretarias ?? []} unidades={unidadesEnr} graficas={graficas ?? []} grupos={gruposEnr} internos={internos} cargos={cargos ?? []} />
    </AppShell>
  );
}
