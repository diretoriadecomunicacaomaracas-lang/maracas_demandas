import Link from "next/link";

export type EventoCal = { id: string; titulo: string; inicio: string; canal?: string | null; subdemanda_id?: string | null };
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const CANAL_COR: Record<string, string> = { digital: "#028EFF", audiovisual: "#FF6729", impresso: "#8A6A00", publicacao: "#4ED980", gravacao: "#FF9E22" };

// Calendário mensal (semana começa na segunda). Somente leitura — a edição
// acontece no Planejamento. Eventos clicáveis abrem a tarefa.
export function CalendarioMes({ eventos, ano, mes, basePath, extraQuery = "" }:
  { eventos: EventoCal[]; ano: number; mes: number; basePath: string; extraQuery?: string }) {
  const primeiro = new Date(ano, mes, 1);
  const inicioSemana = (primeiro.getDay() + 6) % 7; // 0 = segunda
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const hoje = new Date(); const ehHoje = (d: number) => hoje.getFullYear() === ano && hoje.getMonth() === mes && hoje.getDate() === d;

  const celulas: (number | null)[] = [];
  for (let i = 0; i < inicioSemana; i++) celulas.push(null);
  for (let d = 1; d <= diasNoMes; d++) celulas.push(d);
  while (celulas.length % 7 !== 0) celulas.push(null);

  const eventosDoDia = (d: number) => eventos
    .filter((e) => { const x = new Date(e.inicio); return x.getFullYear() === ano && x.getMonth() === mes && x.getDate() === d; })
    .sort((a, b) => a.inicio.localeCompare(b.inicio));

  const nav = (delta: number) => { let m = mes + delta, a = ano; if (m < 0) { m = 11; a--; } if (m > 11) { m = 0; a++; } return `${basePath}?ano=${a}&mes=${m}${extraQuery}`; };
  const q = (a: number, m: number) => `${basePath}?ano=${a}&mes=${m}${extraQuery}`;

  return (
    <div className="card anim-in">
      <div className="card-hd">
        <h2 className="font-bold text-[16px] flex-1">{MESES[mes]} {ano}</h2>
        <div className="flex items-center gap-1">
          <Link href={nav(-1)} className="w-8 h-8 grid place-items-center rounded-md hover:bg-neutro-surface2 pressable" aria-label="Mês anterior">‹</Link>
          <Link href={q(hoje.getFullYear(), hoje.getMonth())} className="h-8 px-3 grid place-items-center rounded-md hover:bg-neutro-surface2 text-[13px] font-semibold pressable">Hoje</Link>
          <Link href={nav(1)} className="w-8 h-8 grid place-items-center rounded-md hover:bg-neutro-surface2 pressable" aria-label="Próximo mês">›</Link>
        </div>
      </div>
      <div className="card-pad">
        <div className="grid grid-cols-7 gap-px text-center text-[11px] font-bold uppercase text-neutro-text3 mb-1">
          {DIAS.map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-px bg-neutro-border rounded-lg overflow-hidden">
          {celulas.map((d, i) => (
            <div key={i} className={`bg-white min-h-[92px] p-1.5 ${d && ehHoje(d) ? "outline outline-2 -outline-offset-2 outline-marca-azul" : ""}`}>
              {d && <>
                <div className={`text-[12px] font-semibold mb-1 ${ehHoje(d) ? "text-marca-azul" : "text-neutro-text2"}`}>{d}</div>
                <div className="flex flex-col gap-1">
                  {eventosDoDia(d).slice(0, 3).map((e) => {
                    const cor = CANAL_COR[e.canal ?? ""] ?? "#028EFF";
                    const hora = new Date(e.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
                    const inner = <span className="flex items-center gap-1 text-[11px] truncate"><span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: cor }} />{hora} {e.titulo}</span>;
                    return e.subdemanda_id
                      ? <Link key={e.id} href={`/app/demandas/${e.subdemanda_id}`} className="block rounded px-1 py-0.5 hover:bg-neutro-surface2 pressable" title={e.titulo}>{inner}</Link>
                      : <span key={e.id} className="block rounded px-1 py-0.5" title={e.titulo}>{inner}</span>;
                  })}
                  {eventosDoDia(d).length > 3 && <span className="text-[10px] text-neutro-text3 px-1">+{eventosDoDia(d).length - 3}</span>}
                </div>
              </>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
