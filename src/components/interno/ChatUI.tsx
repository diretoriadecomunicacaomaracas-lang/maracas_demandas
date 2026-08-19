"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { listarGrupos, listarMensagens, enviarMensagem, editarMensagem, excluirMensagem } from "@/server/data/chat";

type Grupo = { id: string; nome: string; descricao: string | null; naoLidas: number };
type Msg = { id: string; autorId: string; autorNome: string; autorAvatar: string | null; conteudo: string; respondeA: string | null; editada: boolean; createdAt: string };
const hora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function Conteudo({ texto }: { texto: string }) {
  const partes = texto.split(/(@[\p{L}\p{N}._-]+)/u);
  return <>{partes.map((p, i) => p.startsWith("@") ? <span key={i} className="text-marca-azul font-semibold">{p}</span> : <span key={i}>{p}</span>)}</>;
}

export function ChatUI({ grupos0, meId, grupoInicial }: { grupos0: Grupo[]; meId: string; grupoInicial?: string }) {
  const [grupos, setGrupos] = useState<Grupo[]>(grupos0);
  const [sel, setSel] = useState<string | null>(grupoInicial ?? grupos0[0]?.id ?? null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState(""); const [busca, setBusca] = useState("");
  const [editId, setEditId] = useState<string | null>(null); const [editTxt, setEditTxt] = useState("");
  const [pending, start] = useTransition();
  const fimRef = useRef<HTMLDivElement>(null);

  async function carregarMsgs(g: string) { const r = await listarMensagens(g); setMsgs(r.itens); }
  async function refreshGrupos() { setGrupos(await listarGrupos() as any); }
  useEffect(() => { if (sel) carregarMsgs(sel); }, [sel]);
  useEffect(() => {
    const t = setInterval(() => { if (sel) carregarMsgs(sel); refreshGrupos(); }, 5000); // polling (fallback ao Realtime)
    return () => clearInterval(t);
  }, [sel]);
  useEffect(() => { fimRef.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  function enviar() {
    const t = texto.trim(); if (!t || !sel) return;
    start(async () => { const r = await enviarMensagem(sel, t); if (r.ok) { setTexto(""); await carregarMsgs(sel); refreshGrupos(); } });
  }
  function salvarEdicao() {
    if (!editId) return; start(async () => { await editarMensagem(editId, editTxt); setEditId(null); if (sel) carregarMsgs(sel); });
  }
  function excluir(id: string) { start(async () => { await excluirMensagem(id); if (sel) carregarMsgs(sel); }); }

  const grupoSel = grupos.find((g) => g.id === sel);
  const visiveis = busca.trim().length >= 2 ? msgs.filter((m) => m.conteudo.toLowerCase().includes(busca.toLowerCase())) : msgs;

  if (grupos.length === 0) return <EmptyState icone="💬" titulo="Sem grupos" descricao="Você ainda não participa de grupos de bate-papo. A Administração pode incluí-lo." />;

  return (
    <div className="flex gap-4 h-[calc(100vh-160px)]">
      <div className="w-60 flex-none card overflow-auto">
        {grupos.map((g) => (
          <button key={g.id} onClick={() => setSel(g.id)} className={`w-full text-left flex items-center gap-2 p-3 border-b border-neutro-border hover:bg-neutro-surface2 ${sel === g.id ? "bg-[#E7F3FF]" : ""}`}>
            <span className="w-7 h-7 rounded-full bg-marca-azul text-white grid place-items-center flex-none">#</span>
            <b className="text-[13.5px] flex-1 truncate">{g.nome}</b>
            {g.naoLidas > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-marca-vermelho text-white text-[10px] font-bold grid place-items-center">{g.naoLidas > 99 ? "99+" : g.naoLidas}</span>}
          </button>
        ))}
      </div>
      <div className="flex-1 card flex flex-col min-w-0">
        <div className="card-hd">
          <b className="flex-1">{grupoSel?.nome ?? "—"}</b>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar…" className="inp h-8 w-[160px]" />
        </div>
        <div className="flex-1 overflow-auto p-3 flex flex-col gap-3">
          {visiveis.length === 0 && <p className="text-neutro-text3 text-[13px] text-center mt-6">Nenhuma mensagem.</p>}
          {visiveis.map((m) => (
            <div key={m.id} className="flex gap-2 group">
              <Avatar nome={m.autorNome} url={m.autorAvatar} size={30} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[12px] text-neutro-text2"><b className="text-neutro-text">{m.autorNome}</b>{hora(m.createdAt)}{m.editada && <span className="text-neutro-text3">(editada)</span>}
                  {m.autorId === meId && editId !== m.id && <span className="opacity-0 group-hover:opacity-100 flex gap-2">
                    <button onClick={() => { setEditId(m.id); setEditTxt(m.conteudo); }} className="text-marca-azul">editar</button>
                    <button onClick={() => excluir(m.id)} className="text-[#B32219]">excluir</button></span>}
                </div>
                {editId === m.id
                  ? <div className="flex gap-2 mt-1"><input className="inp h-9 flex-1" value={editTxt} onChange={(e) => setEditTxt(e.target.value)} /><Button variant="primary" disabled={pending} onClick={salvarEdicao}>Salvar</Button><button onClick={() => setEditId(null)} className="text-[13px] text-neutro-text2">cancelar</button></div>
                  : <div className="text-[14px] whitespace-pre-wrap break-words"><Conteudo texto={m.conteudo} /></div>}
              </div>
            </div>
          ))}
          <div ref={fimRef} />
        </div>
        <div className="card-hd border-t border-b-0">
          <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
            placeholder="Mensagem…  use @nome para mencionar" className="inp flex-1" aria-label="Nova mensagem" />
          <Button variant="primary" disabled={pending || !texto.trim()} onClick={enviar}>Enviar</Button>
        </div>
      </div>
    </div>
  );
}
