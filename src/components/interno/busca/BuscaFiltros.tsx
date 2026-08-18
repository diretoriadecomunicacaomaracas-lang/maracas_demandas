"use client";
import { useRouter, useSearchParams } from "next/navigation";

type Opcao = { value: string; label: string };
export function BuscaFiltros({ secretarias, internos, status }:
  { secretarias: Opcao[]; internos: Opcao[]; status: Opcao[] }) {
  const router = useRouter();
  const sp = useSearchParams();

  function set(chave: string, valor: string) {
    const p = new URLSearchParams(Array.from(sp.entries()));
    if (valor) p.set(chave, valor); else p.delete(chave);
    router.push(`/app/busca?${p.toString()}`);
  }
  const val = (k: string) => sp.get(k) ?? "";
  const temFiltro = ["secretaria", "tipo", "status", "prioridade", "prof", "de", "ate"].some((k) => sp.get(k));

  const Campo = ({ chave, label, opcoes }: { chave: string; label: string; opcoes: Opcao[] }) => (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase text-neutro-text3">{label}</span>
      <select className="inp h-9" value={val(chave)} onChange={(e) => set(chave, e.target.value)}>
        <option value="">Todos</option>
        {opcoes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );

  return (
    <div className="card card-pad mb-4 anim-in">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
        <Campo chave="secretaria" label="Secretaria" opcoes={secretarias} />
        <Campo chave="tipo" label="Tipo" opcoes={[{ value: "digital", label: "Digital" }, { value: "audiovisual", label: "Audiovisual" }, { value: "impresso", label: "Impresso" }]} />
        <Campo chave="status" label="Status" opcoes={status} />
        <Campo chave="prioridade" label="Prioridade" opcoes={[{ value: "baixa", label: "Baixa" }, { value: "media", label: "Média" }, { value: "alta", label: "Alta" }, { value: "emergencial", label: "Emergencial" }]} />
        <Campo chave="prof" label="Profissional" opcoes={internos} />
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase text-neutro-text3">De</span>
          <input type="date" className="inp h-9" value={val("de")} onChange={(e) => set("de", e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase text-neutro-text3">Até</span>
          <input type="date" className="inp h-9" value={val("ate")} onChange={(e) => set("ate", e.target.value)} />
        </label>
      </div>
      {temFiltro && (
        <button onClick={() => router.push(`/app/busca?q=${encodeURIComponent(val("q"))}`)}
          className="mt-3 text-[13px] font-semibold text-marca-azul pressable">Limpar filtros</button>
      )}
    </div>
  );
}
