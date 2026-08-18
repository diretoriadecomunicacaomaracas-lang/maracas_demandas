"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { excluirLogico } from "@/server/data/demandas";

// Exclusão LÓGICA da demanda (motivo obrigatório). Preserva histórico/links/versões.
export function ExcluirDemanda({ subId, pode }: { subId: string; pode: boolean }) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!pode) return null;

  function excluir() {
    if (!motivo.trim()) { setErro("Informe o motivo."); return; }
    start(async () => {
      const r = await excluirLogico(subId, motivo);
      if (r.ok) router.push("/app/demandas");
      else setErro(r.erro ?? "Erro ao excluir.");
    });
  }
  return (
    <>
      <button onClick={() => setAberto(true)} className="text-[13px] font-semibold text-[#B32219] hover:underline pressable">Excluir demanda</button>
      {aberto && (
        <div className="fixed inset-0 z-[70] bg-black/40 grid place-items-center p-4 anim-fade" onClick={() => setAberto(false)}>
          <div className="card w-[440px] max-w-[96vw] anim-in" onClick={(e) => e.stopPropagation()}>
            <div className="card-hd"><h2 className="font-bold flex-1">Excluir demanda</h2><button aria-label="Fechar" onClick={() => setAberto(false)} className="pressable">✕</button></div>
            <div className="card-pad">
              <p className="text-[13px] text-neutro-text2 mb-3">Exclusão lógica: sai das áreas ativas e vai para a Lixeira. Histórico, links, versões, comentários e aprovações são preservados.</p>
              <textarea className="inp" style={{ minHeight: 80 }} value={motivo} onChange={(e) => { setMotivo(e.target.value); setErro(null); }} placeholder="Motivo da exclusão (obrigatório)…" aria-label="Motivo" />
              {erro && <div role="alert" className="tone-vermelho rounded-[10px] px-3 py-2 text-sm mt-2">{erro}</div>}
            </div>
            <div className="card-hd justify-end"><Button onClick={() => setAberto(false)}>Cancelar</Button><Button variant="danger" disabled={pending} onClick={excluir}>{pending ? "Excluindo…" : "Excluir"}</Button></div>
          </div>
        </div>
      )}
    </>
  );
}
