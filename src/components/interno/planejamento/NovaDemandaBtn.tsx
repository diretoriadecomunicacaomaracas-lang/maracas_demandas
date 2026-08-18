"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { criarDemandaInterna } from "@/server/data/planejamento";

type Opt = { id: string; nome: string; funcao?: string };
export function NovaDemandaBtn({ secretarias, internos }: { secretarias: Opt[]; internos: Opt[] }) {
  const [aberto, setAberto] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter(); const toast = useToast();
  const [f, setF] = useState<any>({ titulo: "", tipo: "digital", area: "", prioridade: "media", prazo: "", briefing: "", secretariaId: "", responsavelId: "", membros: [] as string[], dataPlanejamento: "", observacoes: "", campanha: false });
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));

  function salvar() {
    if (!f.titulo.trim()) { toast.erro("Informe o título."); return; }
    start(async () => {
      const r = await criarDemandaInterna({ ...f, prazo: f.prazo || undefined, dataPlanejamento: f.dataPlanejamento || undefined, secretariaId: f.secretariaId || undefined, responsavelId: f.responsavelId || undefined });
      if (r.ok) { toast.sucesso("Demanda criada."); setAberto(false); router.push(`/app/demandas/${r.subId}`); }
      else toast.erro(r.erro ?? "Erro ao criar.");
    });
  }

  return (
    <>
      <Button variant="primary" onClick={() => setAberto(true)}>+ Nova demanda</Button>
      {aberto && (
        <div className="fixed inset-0 z-[70] bg-black/40 grid place-items-center p-4 anim-fade" onClick={() => setAberto(false)}>
          <div className="card w-[560px] max-w-[96vw] max-h-[90vh] overflow-auto anim-in" onClick={(e) => e.stopPropagation()}>
            <div className="card-hd"><h2 className="font-bold flex-1">Nova demanda interna</h2><button aria-label="Fechar" onClick={() => setAberto(false)} className="pressable">✕</button></div>
            <div className="card-pad grid gap-3">
              <label className="block"><span className="block text-[13px] font-semibold mb-1">Título*</span><input className="inp" value={f.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex.: Card de lançamento Agosto Lilás" /></label>
              <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <label className="block"><span className="block text-[13px] font-semibold mb-1">Tipo</span><select className="inp" value={f.tipo} onChange={(e) => set("tipo", e.target.value)}><option value="digital">Digital</option><option value="audiovisual">Audiovisual</option><option value="impresso">Impresso</option></select></label>
                <label className="block"><span className="block text-[13px] font-semibold mb-1">Área / fluxo</span><input className="inp" value={f.area} onChange={(e) => set("area", e.target.value)} placeholder="Ex.: Redes sociais" /></label>
                <label className="block"><span className="block text-[13px] font-semibold mb-1">Prioridade</span><select className="inp" value={f.prioridade} onChange={(e) => set("prioridade", e.target.value)}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="emergencial">Emergencial</option></select></label>
                <label className="block"><span className="block text-[13px] font-semibold mb-1">Prazo interno</span><input type="datetime-local" className="inp" value={f.prazo} onChange={(e) => set("prazo", e.target.value)} /></label>
                <label className="block"><span className="block text-[13px] font-semibold mb-1">Secretaria (contexto)</span><select className="inp" value={f.secretariaId} onChange={(e) => set("secretariaId", e.target.value)}><option value="">—</option>{secretarias.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></label>
                <label className="block"><span className="block text-[13px] font-semibold mb-1">Data de planejamento</span><input type="datetime-local" className="inp" value={f.dataPlanejamento} onChange={(e) => set("dataPlanejamento", e.target.value)} /></label>
              </div>
              <label className="block"><span className="block text-[13px] font-semibold mb-1">Responsável</span><select className="inp" value={f.responsavelId} onChange={(e) => set("responsavelId", e.target.value)}><option value="">— aguardando distribuição —</option>{internos.map((u) => <option key={u.id} value={u.id}>{u.nome}{u.funcao ? ` (${u.funcao})` : ""}</option>)}</select></label>
              <label className="block"><span className="block text-[13px] font-semibold mb-1">Colaboradores</span>
                <div className="flex flex-wrap gap-1.5">{internos.map((u) => { const on = f.membros.includes(u.id); return <button key={u.id} type="button" onClick={() => set("membros", on ? f.membros.filter((x: string) => x !== u.id) : [...f.membros, u.id])} className={`text-[12px] px-2 py-1 rounded-full border pressable ${on ? "bg-[#E7F3FF] border-marca-azul text-marca-azul" : "border-neutro-border text-neutro-text2"}`}>{u.nome}</button>; })}</div>
              </label>
              <label className="block"><span className="block text-[13px] font-semibold mb-1">Briefing</span><textarea className="inp" style={{ minHeight: 80 }} value={f.briefing} onChange={(e) => set("briefing", e.target.value)} placeholder="Objetivo, público, orientações…" /></label>
              <label className="block"><span className="block text-[13px] font-semibold mb-1">Observações</span><input className="inp" value={f.observacoes} onChange={(e) => set("observacoes", e.target.value)} /></label>
              <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={f.campanha} onChange={(e) => set("campanha", e.target.checked)} /> É uma campanha (agrupa vários itens)</label>
            </div>
            <div className="card-hd justify-end"><Button onClick={() => setAberto(false)}>Cancelar</Button><Button variant="primary" disabled={pending} onClick={salvar}>{pending ? "Criando…" : "Criar demanda"}</Button></div>
          </div>
        </div>
      )}
    </>
  );
}
