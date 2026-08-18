"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { StatusChip, AtrasoChip } from "@/components/ui/StatusChip";
import { PriorityChip } from "@/components/ui/Priority";
import { atrasoDias } from "@/domain/rules";

type Pessoa = { id: string; nome: string; avatarUrl?: string | null };
type Sub = { id: string; titulo: string; tipo: string; etapa: string; macroetapa: string; prazo: string | null; prioridade: string; responsavel?: Pessoa | null; membros?: Pessoa[] };

const hojeIni = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const hojeFim = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; };
const entre = (iso: string | null, a: Date, b: Date) => !!iso && new Date(iso) >= a && new Date(iso) <= b;
const emN = (n: number) => new Date(hojeFim().getTime() + n * 86400e3);

// Resumo por tipo (buckets operacionais).
function resumoDe(tipo: string, subs: Sub[]) {
  const atras = (s: Sub) => atrasoDias(s.prazo, s.macroetapa) > 0;
  const base = [
    { label: "Prazos hoje", n: subs.filter((s) => entre(s.prazo, hojeIni(), hojeFim())).length, tom: "amarelo" },
    { label: "Atrasadas", n: subs.filter(atras).length, tom: "vermelho" },
    { label: "Próx. entregas (7d)", n: subs.filter((s) => entre(s.prazo, emN(0), emN(7))).length, tom: "ciano" },
  ];
  if (tipo === "audiovisual") return [
    { label: "Gravações hoje", n: subs.filter((s) => s.etapa === "gravacao" && entre(s.prazo, hojeIni(), hojeFim())).length, tom: "laranja" },
    { label: "Aguardando roteiro", n: subs.filter((s) => ["planejamento", "roteiro"].includes(s.etapa)).length, tom: "amarelo" },
    { label: "Aguardando gravação", n: subs.filter((s) => s.etapa === "gravacao_aguard").length, tom: "laranja" },
    { label: "Em edição", n: subs.filter((s) => ["edicao", "edicao_aguard"].includes(s.etapa)).length, tom: "laranja" },
    { label: "Revisão/Correção", n: subs.filter((s) => ["revisao", "correcao"].includes(s.etapa)).length, tom: "laranjaverm" },
    ...base,
  ];
  return [
    { label: "Em criação", n: subs.filter((s) => s.etapa === "criacao").length, tom: "laranja" },
    { label: "Aguardando revisão", n: subs.filter((s) => s.etapa === "revisao").length, tom: "ciano" },
    { label: "Em correção", n: subs.filter((s) => s.etapa === "correcao").length, tom: "vermelho" },
    ...base,
  ];
}

export function PainelArea({ subs, tipo, meId }: { subs: Sub[]; tipo: string; meId: string }) {
  const [aba, setAba] = useState<"minha" | "equipe">("equipe");
  const doTipo = useMemo(() => subs.filter((s) => s.tipo === tipo), [subs, tipo]);
  const minhas = useMemo(() => doTipo.filter((s) => s.responsavel?.id === meId || (s.membros ?? []).some((m) => m.id === meId)), [doTipo, meId]);
  const visiveis = aba === "minha" ? minhas : doTipo;
  const resumo = resumoDe(tipo, visiveis);

  // Por profissional (responsáveis presentes no conjunto do tipo)
  const profs = useMemo(() => {
    const map = new Map<string, { pessoa: Pessoa; itens: Sub[] }>();
    for (const s of doTipo) if (s.responsavel) {
      const e = map.get(s.responsavel.id) ?? { pessoa: s.responsavel, itens: [] };
      e.itens.push(s); map.set(s.responsavel.id, e);
    }
    return [...map.values()].sort((a, b) => b.itens.length - a.itens.length);
  }, [doTipo]);

  return (
    <div>
      <div className="inline-flex bg-neutro-surface2 border border-neutro-border rounded-[10px] p-[3px] mb-4">
        {[["equipe", "Equipe"], ["minha", "Minha fila"]].map(([v, lab]) => (
          <button key={v} onClick={() => setAba(v as any)} className={`h-8 px-3 rounded-lg font-semibold text-[13px] ${aba === v ? "bg-white text-marca-azul" : "text-neutro-text2"}`}>{lab}</button>
        ))}
      </div>

      <div className="grid gap-3 stagger mb-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
        {resumo.map((r) => (
          <div key={r.label} className="card card-pad anim-in">
            <div className="text-[12.5px] text-neutro-text2">{r.label}</div>
            <div className={`text-[22px] font-extrabold mt-1`}>{r.n}</div>
          </div>
        ))}
      </div>

      {aba === "equipe" && (
        <div className="flex flex-col gap-4 mb-6">
          {profs.length === 0 && <p className="text-neutro-text3 text-[13px]">Nenhum profissional com tarefas nesta área.</p>}
          {profs.map(({ pessoa, itens }) => {
            const atrasadas = itens.filter((s) => atrasoDias(s.prazo, s.macroetapa) > 0).length;
            const hoje = itens.filter((s) => entre(s.prazo, hojeIni(), hojeFim())).length;
            const revisao = itens.filter((s) => ["revisao", "correcao"].includes(s.etapa)).length;
            return (
              <section key={pessoa.id} className="card anim-in">
                <div className="card-hd">
                  <Avatar nome={pessoa.nome} url={pessoa.avatarUrl} size={34} />
                  <div className="flex-1"><div className="font-bold text-[14px]">{pessoa.nome}</div>
                    <div className="text-[12px] text-neutro-text3">{itens.length} ativas · {hoje} hoje · {atrasadas} atrasadas · {revisao} em revisão</div></div>
                </div>
                <div className="card-pad grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
                  {itens.map((s) => <Card key={s.id} s={s} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {aba === "minha" && (
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
          {visiveis.length === 0 ? <p className="text-neutro-text3 text-[13px]">Você não tem tarefas nesta área.</p> : visiveis.map((s) => <Card key={s.id} s={s} />)}
        </div>
      )}
    </div>
  );
}

function Card({ s }: { s: Sub }) {
  const dias = atrasoDias(s.prazo, s.macroetapa);
  const equipe = [...(s.responsavel ? [s.responsavel] : []), ...(s.membros ?? [])];
  return (
    <Link href={`/app/demandas/${s.id}`} className="card card-pad hoverable pressable block">
      <div className="flex items-center gap-2 flex-wrap mb-1"><PriorityChip prioridade={s.prioridade} />{dias > 0 && <AtrasoChip dias={dias} />}</div>
      <div className="font-semibold text-[13.5px] mb-1">{s.titulo}</div>
      <div className="flex items-center justify-between gap-2">
        <StatusChip status={s.etapa} />
        {equipe.length > 0 && <AvatarStack pessoas={equipe} max={4} />}
      </div>
      <div className="text-[12px] text-neutro-text3 mt-1">{s.prazo ? `Prazo ${new Date(s.prazo).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : "Sem prazo"}</div>
    </Link>
  );
}
