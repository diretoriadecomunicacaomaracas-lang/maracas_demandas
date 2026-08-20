"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import * as A from "@/server/data/admin";

type Row = any;
const TABS = ["Usuários", "Secretarias", "Setores", "Gráficas", "Grupos"] as const;

export function AdminPanel({ usuarios, secretarias, unidades, graficas, grupos, internos, cargos }:
  { usuarios: Row[]; secretarias: Row[]; unidades: Row[]; graficas: Row[]; grupos: Row[]; internos: Row[]; cargos: Row[] }) {
  const [tab, setTab] = useState<typeof TABS[number]>("Usuários");
  const [pending, start] = useTransition();
  const router = useRouter(); const toast = useToast();
  function run(p: Promise<any>, okMsg = "Feito.") { start(async () => { const r = await p; if (r?.ok) { toast.sucesso(okMsg); router.refresh(); } else toast.erro(r?.erro ?? "Erro."); }); }
  function del(msg: string, p: () => Promise<any>) {
    if (!window.confirm(msg)) return;
    start(async () => { const r = await p(); if (r?.ok) { toast.sucesso(r.modo === "soft" ? "Desativado (possui histórico — preservado)." : "Removido definitivamente."); router.refresh(); } else toast.erro(r?.erro ?? "Erro."); });
  }

  return (
    <div>
      <div className="inline-flex bg-neutro-surface2 border border-neutro-border rounded-[10px] p-[3px] mb-4 flex-wrap">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`h-8 px-3 rounded-lg font-semibold text-[13px] ${tab === t ? "bg-white text-marca-azul" : "text-neutro-text2"}`}>{t}</button>)}
      </div>

      {tab === "Usuários" && <Usuarios usuarios={usuarios} secretarias={secretarias} unidades={unidades} graficas={graficas} cargos={cargos} run={run} del={del} pending={pending} />}
      {tab === "Secretarias" && <Secretarias itens={secretarias} run={run} del={del} pending={pending} />}
      {tab === "Setores" && <Setores unidades={unidades} secretarias={secretarias} run={run} del={del} pending={pending} />}
      {tab === "Gráficas" && <Graficas itens={graficas} run={run} del={del} pending={pending} />}
      {tab === "Grupos" && <Grupos grupos={grupos} internos={internos} run={run} del={del} pending={pending} />}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) { return <div className="card card-pad">{children}</div>; }
function AddRow({ ph, onAdd, pending }: { ph: string; onAdd: (v: string) => void; pending: boolean }) {
  const [v, setV] = useState("");
  return <div className="flex gap-2 mb-3"><input className="inp h-9" placeholder={ph} value={v} onChange={(e) => setV(e.target.value)} /><Button variant="primary" disabled={pending || !v.trim()} onClick={() => { onAdd(v); setV(""); }}>Adicionar</Button></div>;
}

function Secretarias({ itens, run, del, pending }: any) {
  return <Card>
    <AddRow ph="Nova secretaria…" pending={pending} onAdd={(v) => run(A.criarSecretaria(v), "Secretaria criada.")} />
    <ul className="flex flex-col">{itens.map((s: Row) => (
      <li key={s.id} className="flex items-center gap-2 py-2 border-b border-neutro-border text-[13.5px]">
        <span className={`flex-1 ${s.deleted_at ? "line-through text-neutro-text3" : ""}`}>{s.nome}</span>
        <button className="text-marca-azul text-[12px] font-semibold" onClick={() => { const n = prompt("Novo nome:", s.nome); if (n) run(A.editarSecretaria(s.id, n), "Renomeada."); }}>renomear</button>
        <button className="text-[12px] font-semibold" onClick={() => run(A.toggleSecretaria(s.id, !!s.deleted_at), s.deleted_at ? "Reativada." : "Desativada.")}>{s.deleted_at ? "reativar" : "desativar"}</button>
        <button className="text-[12px] font-semibold text-[#B32219]" onClick={() => del(`Excluir a secretaria "${s.nome}"? Se houver registros vinculados, ela será apenas desativada e preservada.`, () => A.excluirSecretaria(s.id))}>excluir</button>
      </li>))}</ul>
  </Card>;
}
function Setores({ unidades, secretarias, run, del, pending }: any) {
  const [sec, setSec] = useState(""); const [nome, setNome] = useState("");
  return <Card>
    <div className="flex gap-2 mb-3 flex-wrap">
      <select className="inp h-9 w-[220px]" value={sec} onChange={(e) => setSec(e.target.value)}><option value="">Secretaria…</option>{secretarias.map((s: Row) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select>
      <input className="inp h-9 flex-1" placeholder="Novo setor/unidade…" value={nome} onChange={(e) => setNome(e.target.value)} />
      <Button variant="primary" disabled={pending || !sec || !nome.trim()} onClick={() => { run(A.criarUnidade(sec, nome), "Setor criado."); setNome(""); }}>Adicionar</Button>
    </div>
    <ul className="flex flex-col">{unidades.map((u: Row) => (
      <li key={u.id} className="flex items-center gap-2 py-2 border-b border-neutro-border text-[13.5px]">
        <span className={`flex-1 ${u.deleted_at ? "line-through text-neutro-text3" : ""}`}>{u.nome} <span className="text-neutro-text3 text-[12px]">· {u.secretariaNome}</span></span>
        <button className="text-marca-azul text-[12px] font-semibold" onClick={() => { const n = prompt("Novo nome:", u.nome); if (n) run(A.editarUnidade(u.id, { nome: n }), "Renomeado."); }}>renomear</button>
        <button className="text-[12px] font-semibold" onClick={() => run(A.toggleUnidade(u.id, !!u.deleted_at), "Feito.")}>{u.deleted_at ? "reativar" : "desativar"}</button>
        <button className="text-[12px] font-semibold text-[#B32219]" onClick={() => del(`Excluir o setor "${u.nome}"? Se houver registros vinculados, será apenas desativado.`, () => A.excluirUnidade(u.id))}>excluir</button>
      </li>))}</ul>
  </Card>;
}
function Graficas({ itens, run, del, pending }: any) {
  const [nome, setNome] = useState(""); const [email, setEmail] = useState("");
  return <Card>
    <div className="flex gap-2 mb-3 flex-wrap"><input className="inp h-9 flex-1" placeholder="Nome da gráfica…" value={nome} onChange={(e) => setNome(e.target.value)} /><input className="inp h-9 flex-1" placeholder="E-mail de contato" value={email} onChange={(e) => setEmail(e.target.value)} /><Button variant="primary" disabled={pending || !nome.trim()} onClick={() => { run(A.criarGrafica({ nome, contato_email: email }), "Gráfica criada."); setNome(""); setEmail(""); }}>Adicionar</Button></div>
    <ul className="flex flex-col">{itens.map((g: Row) => (
      <li key={g.id} className="flex items-center gap-2 py-2 border-b border-neutro-border text-[13.5px]">
        <span className={`flex-1 ${g.ativa ? "" : "text-neutro-text3"}`}>{g.nome} <span className="text-neutro-text3 text-[12px]">· {g.contato_email ?? "sem e-mail"}</span></span>
        <button className="text-marca-azul text-[12px] font-semibold" onClick={() => { const n = prompt("Novo nome:", g.nome); if (n) run(A.editarGrafica(g.id, { nome: n }), "Renomeada."); }}>renomear</button>
        <button className="text-[12px] font-semibold" onClick={() => run(A.toggleGrafica(g.id, !g.ativa), "Feito.")}>{g.ativa ? "desativar" : "ativar"}</button>
        <button className="text-[12px] font-semibold text-[#B32219]" onClick={() => del(`Excluir a gráfica "${g.nome}"? Se houver pedidos vinculados, será apenas desativada.`, () => A.excluirGrafica(g.id))}>excluir</button>
      </li>))}</ul>
  </Card>;
}
function Grupos({ grupos, internos, run, del, pending }: any) {
  const [membros, setMembros] = useState<string | null>(null);
  const g = grupos.find((x: Row) => x.id === membros);
  return <Card>
    <AddRow ph="Novo grupo…" pending={pending} onAdd={(v) => run(A.criarGrupo({ nome: v }), "Grupo criado.")} />
    <ul className="flex flex-col">{grupos.map((x: Row) => (
      <li key={x.id} className="flex items-center gap-2 py-2 border-b border-neutro-border text-[13.5px]">
        <span className={`flex-1 ${x.arquivado ? "line-through text-neutro-text3" : ""}`}>{x.nome} <span className="text-neutro-text3 text-[12px]">· {x.nMembros} membro(s)</span></span>
        <button className="text-marca-azul text-[12px] font-semibold" onClick={() => setMembros(x.id)}>membros</button>
        <button className="text-marca-azul text-[12px] font-semibold" onClick={() => { const n = prompt("Novo nome:", x.nome); if (n) run(A.editarGrupo(x.id, { nome: n }), "Renomeado."); }}>renomear</button>
        <button className="text-[12px] font-semibold" onClick={() => run(A.editarGrupo(x.id, { arquivado: !x.arquivado }), "Feito.")}>{x.arquivado ? "reativar" : "arquivar"}</button>
        <button className="text-[12px] font-semibold text-[#B32219]" onClick={() => del(`Excluir o grupo "${x.nome}"? Se houver mensagens, será apenas arquivado.`, () => A.excluirGrupo(x.id))}>excluir</button>
      </li>))}</ul>
    {g && <div className="fixed inset-0 z-[70] bg-black/40 grid place-items-center p-4 anim-fade" onClick={() => setMembros(null)}>
      <div className="card w-[440px] max-w-[96vw] max-h-[80vh] overflow-auto anim-in" onClick={(e) => e.stopPropagation()}>
        <div className="card-hd"><b className="flex-1">Membros · {g.nome}</b><button onClick={() => setMembros(null)} className="pressable">✕</button></div>
        <div className="card-pad flex flex-col gap-1">{internos.map((u: Row) => { const on = (g.membros ?? []).includes(u.id); return (
          <label key={u.id} className="flex items-center gap-2 text-[13px] py-1"><input type="checkbox" checked={on} onChange={() => run(A.setMembroGrupo(g.id, u.id, !on), "Atualizado.")} /> {u.nome}</label>); })}</div>
      </div>
    </div>}
  </Card>;
}
function Usuarios({ usuarios, secretarias, unidades, graficas, cargos, run, del, pending }: any) {
  const [novo, setNovo] = useState(false);
  const [f, setF] = useState<any>({ nome: "", email: "", ambiente: "interno", cargoChave: "", secretariaId: "", unidadeId: "" });
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));
  return <Card>
    <div className="flex items-center mb-3"><b className="flex-1">Usuários ({usuarios.length})</b><Button variant="primary" onClick={() => setNovo(true)}>+ Criar usuário</Button></div>
    <div className="overflow-x-auto"><table className="w-full text-[13px] min-w-[560px]"><thead><tr className="text-left text-[11px] uppercase text-neutro-text3"><th className="py-1">Nome</th><th className="py-1">E-mail</th><th className="py-1">Ambiente</th><th className="py-1">Situação</th><th className="py-1"></th></tr></thead>
      <tbody>{usuarios.map((u: Row) => (
        <tr key={u.id} className="border-t border-neutro-border"><td className="py-1.5 font-medium">{u.nome}</td><td className="py-1.5 text-neutro-text2">{u.email}</td><td className="py-1.5 capitalize">{u.ambiente_principal}</td>
          <td className="py-1.5">{u.situacao}</td>
          <td className="py-1.5"><div className="flex gap-2 flex-wrap">
            {u.situacao === "aguardando_ativacao" && <button className="text-[12px] font-semibold text-marca-azul" onClick={() => run(A.reenviarConvite(u.id), "Convite reenviado.")}>reenviar</button>}
            <button className="text-[12px] font-semibold" onClick={() => run(A.toggleUsuario(u.id, u.situacao !== "ativa"), "Feito.")}>{u.situacao === "ativa" ? "desativar" : "ativar"}</button>
            <button className="text-[12px] font-semibold text-[#B32219]" onClick={() => del(`Excluir "${u.nome}"? Se tiver histórico, será apenas desativado; se for apenas um convite, o e-mail é liberado.`, () => A.excluirUsuario(u.id))}>excluir</button>
          </div></td>
        </tr>))}</tbody></table></div>
    {novo && <div className="fixed inset-0 z-[70] bg-black/40 grid place-items-center p-4 anim-fade" onClick={() => setNovo(false)}>
      <div className="card w-[520px] max-w-[96vw] max-h-[90vh] overflow-auto anim-in" onClick={(e) => e.stopPropagation()}>
        <div className="card-hd"><b className="flex-1">Criar usuário (convite seguro)</b><button onClick={() => setNovo(false)} className="pressable">✕</button></div>
        <div className="card-pad grid gap-3">
          <p className="text-[12px] text-neutro-text3">A pessoa recebe um e-mail com link seguro para definir a própria senha. Nenhuma senha é enviada em texto.</p>
          <input className="inp" placeholder="Nome completo" value={f.nome} onChange={(e) => set("nome", e.target.value)} />
          <input className="inp" placeholder="E-mail" value={f.email} onChange={(e) => set("email", e.target.value)} />
          <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <select className="inp" value={f.ambiente} onChange={(e) => set("ambiente", e.target.value)}><option value="interno">Equipe interna</option><option value="solicitante">Solicitante</option><option value="grafica">Gráfica</option></select>
            <select className="inp" value={f.cargoChave} onChange={(e) => set("cargoChave", e.target.value)}><option value="">Cargo/função…</option>{cargos.map((c: Row) => <option key={c.chave} value={c.chave}>{c.nome}</option>)}</select>
            {f.ambiente === "solicitante" && <><select className="inp" value={f.secretariaId} onChange={(e) => set("secretariaId", e.target.value)}><option value="">Secretaria…</option>{secretarias.map((s: Row) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select>
              <select className="inp" value={f.unidadeId} onChange={(e) => set("unidadeId", e.target.value)}><option value="">Setor…</option>{unidades.filter((u: Row) => u.secretaria_id === f.secretariaId).map((u: Row) => <option key={u.id} value={u.id}>{u.nome}</option>)}</select></>}
          </div>
        </div>
        <div className="card-hd justify-end"><Button onClick={() => setNovo(false)}>Cancelar</Button><Button variant="primary" disabled={pending} onClick={() => run(A.criarUsuario({ nome: f.nome, email: f.email, ambiente: f.ambiente, cargoChave: f.cargoChave || undefined, secretariaId: f.secretariaId || undefined, unidadeId: f.unidadeId || undefined }), "Convite enviado.")}>Criar e convidar</Button></div>
      </div>
    </div>}
  </Card>;
}
