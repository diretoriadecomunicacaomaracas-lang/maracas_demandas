import { AppShell } from "@/components/layout/AppShell";
import { exigirInterno } from "@/components/interno/GuardInterno";
import { createSupabaseServer } from "@/lib/supabase-server";
import { todasUnidades } from "@/server/data/unidades";
import { AdminSetores } from "@/components/interno/AdminSetores";
export default async function Admin() {
  const ator = await exigirInterno("administrar_usuarios"); // bloqueia acesso indevido, inclusive por URL
  const sb = createSupabaseServer();
  const [{ data: usuarios }, { data: convites }, { data: secretarias }, { data: graficas }] = await Promise.all([
    sb.from("usuarios").select("nome,email,situacao,ambiente_principal").is("deleted_at", null).limit(50),
    sb.from("convites").select("nome,email,expira_em,usado_em").is("usado_em", null).limit(50),
    sb.from("secretarias").select("nome").is("deleted_at", null),
    sb.from("graficas").select("nome,ativa").is("deleted_at", null),
  ]);
  const { data: secList } = await sb.from("secretarias").select("id,nome").is("deleted_at", null).order("nome");
  const unidades = await todasUnidades();
  return (
    <AppShell atual="admin" usuario={{ nome: ator.nome, cargo: ator.cargos[0] ?? "Interno" }}>
      <h1 className="text-[22px] font-bold mb-4">Administração</h1>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
        <Bloco titulo={`Usuários (${(usuarios ?? []).length})`}>{(usuarios ?? []).map((u: any, i: number) => <li key={i} className="py-1.5 border-b border-dashed border-neutro-border text-[13px]">{u.nome} — <span className="text-neutro-text2">{u.email} · {u.situacao}</span></li>)}</Bloco>
        <Bloco titulo={`Convites pendentes (${(convites ?? []).length})`}>{(convites ?? []).map((c: any, i: number) => <li key={i} className="py-1.5 border-b border-dashed border-neutro-border text-[13px]">{c.nome} — <span className="text-neutro-text2">{c.email}</span></li>)}{(convites ?? []).length === 0 && <li className="text-neutro-text2 text-[13px]">Nenhum.</li>}</Bloco>
        <Bloco titulo={`Secretarias (${(secretarias ?? []).length})`}>{(secretarias ?? []).map((s: any, i: number) => <li key={i} className="py-1.5 border-b border-dashed border-neutro-border text-[13px]">{s.nome}</li>)}</Bloco>
        <Bloco titulo={`Gráficas (${(graficas ?? []).length})`}>{(graficas ?? []).map((g: any, i: number) => <li key={i} className="py-1.5 border-b border-dashed border-neutro-border text-[13px]">{g.nome} {g.ativa ? "" : "(inativa)"}</li>)}</Bloco>
      </div>
      <div className="mt-4 max-w-[560px]"><AdminSetores secretarias={(secList ?? []) as any} unidades={unidades as any} /></div>
    </AppShell>
  );
}
function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <div className="bg-white border border-neutro-border rounded-xl p-4"><b>{titulo}</b><ul className="mt-2 list-none p-0">{children}</ul></div>;
}
