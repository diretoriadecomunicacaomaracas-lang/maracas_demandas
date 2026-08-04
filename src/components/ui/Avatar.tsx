const CORES = ["#028EFF","#FF6729","#4ED980","#FF9E22","#0EC7FF","#FF3B2B","#8EEA00","#FFB214"];
function corDe(nome: string) { let h = 0; for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0; return CORES[h % CORES.length]; }
function iniciais(nome: string) { return nome.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase(); }

export function Avatar({ nome, url, funcao, size = 28 }: { nome: string; url?: string | null; funcao?: string; size?: number }) {
  const title = funcao ? `${nome} — ${funcao}` : nome;
  const s = { width: size, height: size, fontSize: Math.round(size * 0.4) };
  if (url) return <img src={url} alt={nome} title={title} className="rounded-full object-cover flex-none border-2 border-white" style={s} />;
  return <span title={title} aria-label={title} className="rounded-full grid place-items-center font-bold text-white flex-none border-2 border-white"
    style={{ ...s, background: corDe(nome) }}>{iniciais(nome)}</span>;
}
export function AvatarStack({ pessoas, max = 4 }: { pessoas: { nome: string; url?: string | null; funcao?: string }[]; max?: number }) {
  const vis = pessoas.slice(0, max); const resto = pessoas.length - vis.length;
  return (
    <span className="inline-flex items-center">
      <span className="inline-flex" style={{ marginRight: resto > 0 ? 6 : 0 }}>
        {vis.map((p, i) => <span key={i} style={{ marginLeft: i ? -8 : 0 }}><Avatar nome={p.nome} url={p.url} funcao={p.funcao} size={26} /></span>)}
      </span>
      {resto > 0 && <span className="text-[12px] text-neutro-text2">+{resto}</span>}
    </span>
  );
}
