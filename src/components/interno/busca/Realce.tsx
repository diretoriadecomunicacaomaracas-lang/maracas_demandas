import { segmentosDestaque, trecho } from "@/domain/busca";

// Destaca os termos pesquisados dentro de um trecho relevante do texto.
export function Realce({ texto, termo, raio = 70 }: { texto: string; termo: string; raio?: number }) {
  const t = trecho(texto, termo, raio);
  if (!t) return null;
  const segs = segmentosDestaque(t, termo);
  return (
    <>
      {segs.map((s, i) => (s.hit ? <mark key={i}>{s.texto}</mark> : <span key={i}>{s.texto}</span>))}
    </>
  );
}
