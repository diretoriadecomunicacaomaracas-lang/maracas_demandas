import Link from "next/link";

const PALETA = ["#028EFF", "#0EC7FF", "#4ED980", "#FFC605", "#FF9E22", "#FF6729", "#FF3B2B", "#8EEA00"];
type Dado = { chave?: string; nome: string; total: number };

// Barras horizontais (HTML): acessível, valor textual sempre visível, tooltip,
// clicável (abre lista filtrada) e não dependente só de cor.
export function BarrasHorizontais({ dados, hrefDe, cor = "#028EFF", vazio = "Sem dados." }:
  { dados: Dado[]; hrefDe?: (d: Dado) => string; cor?: string; vazio?: string }) {
  const max = Math.max(1, ...dados.map((d) => d.total));
  if (!dados.some((d) => d.total > 0)) return <p className="text-neutro-text3 text-[13px]">{vazio}</p>;
  return (
    <ul className="flex flex-col gap-2" role="list">
      {dados.map((d) => {
        const pct = Math.round((d.total / max) * 100);
        const linha = (
          <div className="flex items-center gap-2" title={`${d.nome}: ${d.total}`}>
            <span className="w-[42%] text-[12.5px] text-neutro-text2 truncate">{d.nome}</span>
            <span className="flex-1 h-[18px] bg-neutro-surface2 rounded-md overflow-hidden">
              <span className="block h-full rounded-md" style={{ width: `${pct}%`, background: cor, transition: "width .3s ease" }} />
            </span>
            <span className="w-8 text-right text-[13px] font-semibold tabular-nums">{d.total}</span>
          </div>
        );
        return (
          <li key={d.chave ?? d.nome}>
            {hrefDe ? <Link href={hrefDe(d)} className="block rounded-md hover:bg-neutro-surface2 -mx-1 px-1 py-0.5 pressable">{linha}</Link> : linha}
          </li>
        );
      })}
    </ul>
  );
}

// Colunas verticais (SVG) para série temporal (volume mensal etc.).
export function Colunas({ dados, cor = "#028EFF" }: { dados: Dado[]; cor?: string }) {
  const max = Math.max(1, ...dados.map((d) => d.total));
  const W = 320, H = 120, pad = 22, n = dados.length || 1;
  const bw = (W - pad * 2) / n * 0.6, gap = (W - pad * 2) / n;
  if (!dados.some((d) => d.total > 0)) return <p className="text-neutro-text3 text-[13px]">Sem dados no período.</p>;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Gráfico de colunas por mês">
      {dados.map((d, i) => {
        const h = Math.round((d.total / max) * (H - pad * 2));
        const x = pad + i * gap + (gap - bw) / 2; const y = H - pad - h;
        return (
          <g key={d.chave ?? i}>
            <title>{`${d.nome}: ${d.total}`}</title>
            <rect x={x} y={y} width={bw} height={Math.max(h, d.total > 0 ? 2 : 0)} rx={3} fill={cor} />
            <text x={x + bw / 2} y={H - pad + 12} textAnchor="middle" fontSize="9" fill="#98A1B0">{d.nome}</text>
            <text x={x + bw / 2} y={y - 3} textAnchor="middle" fontSize="9" fontWeight="700" fill="#5B6472">{d.total || ""}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Rosca (SVG) com legenda: valor + percentual + rótulo (não só cor).
export function Rosca({ dados }: { dados: Dado[] }) {
  const total = dados.reduce((a, d) => a + d.total, 0);
  if (!total) return <p className="text-neutro-text3 text-[13px]">Sem dados.</p>;
  const R = 42, C = 2 * Math.PI * R; let acc = 0;
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg viewBox="0 0 110 110" className="w-[110px] h-[110px] flex-none" role="img" aria-label="Distribuição por status">
        <circle cx="55" cy="55" r={R} fill="none" stroke="#F2F4F7" strokeWidth="14" />
        {dados.map((d, i) => {
          if (!d.total) return null;
          const frac = d.total / total; const dash = frac * C;
          const el = (
            <circle key={i} cx="55" cy="55" r={R} fill="none" stroke={PALETA[i % PALETA.length]} strokeWidth="14"
              strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-acc} transform="rotate(-90 55 55)">
              <title>{`${d.nome}: ${d.total} (${Math.round(frac * 100)}%)`}</title>
            </circle>
          );
          acc += dash; return el;
        })}
        <text x="55" y="52" textAnchor="middle" fontSize="15" fontWeight="800" fill="#1F2430">{total}</text>
        <text x="55" y="66" textAnchor="middle" fontSize="8" fill="#98A1B0">total</text>
      </svg>
      <ul className="flex flex-col gap-1 text-[12.5px]">
        {dados.filter((d) => d.total > 0).map((d, i) => (
          <li key={d.chave ?? i} className="flex items-center gap-2">
            <span aria-hidden className="w-3 h-3 rounded-sm flex-none" style={{ background: PALETA[i % PALETA.length] }} />
            <span className="text-neutro-text2">{d.nome}</span>
            <span className="font-semibold">{d.total}</span>
            <span className="text-neutro-text3">({Math.round((d.total / total) * 100)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
