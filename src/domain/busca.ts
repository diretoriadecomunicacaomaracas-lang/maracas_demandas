// Núcleo puro da Busca Global (sem dependências externas).
// Normaliza (minúsculas + sem acento), tokeniza, casa multi-palavra (todos os
// termos, parcial) e produz trecho + destaque. Usado pela busca (fallback) e testes.

export function normalizar(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove diacríticos (acentos)
    .toLowerCase()
    .trim();
}

export function tokens(termo: string): string[] {
  return normalizar(termo).split(/\s+/).filter(Boolean);
}

// Todos os tokens precisam aparecer no texto (parcial, sem acento, sem caixa).
export function casa(haystack: string, termo: string): boolean {
  const alvo = normalizar(haystack);
  const ts = tokens(termo);
  if (!ts.length) return false;
  return ts.every((t) => alvo.includes(t));
}

// Trecho em torno da primeira ocorrência de qualquer token (para exibição).
export function trecho(texto: string | null | undefined, termo: string, raio = 60): string {
  const original = (texto ?? "").replace(/\s+/g, " ").trim();
  if (!original) return "";
  const alvo = normalizar(original);
  const ts = tokens(termo);
  let pos = -1;
  for (const t of ts) { const i = alvo.indexOf(t); if (i >= 0 && (pos < 0 || i < pos)) pos = i; }
  if (pos < 0) return original.slice(0, raio * 2) + (original.length > raio * 2 ? "…" : "");
  const ini = Math.max(0, pos - raio);
  const fim = Math.min(original.length, pos + raio);
  return (ini > 0 ? "…" : "") + original.slice(ini, fim).trim() + (fim < original.length ? "…" : "");
}

// Segmentos para destaque (o componente envolve os "hit" em <mark>).
export function segmentosDestaque(texto: string, termo: string): { texto: string; hit: boolean }[] {
  const ts = [...new Set(tokens(termo))].sort((a, b) => b.length - a.length);
  if (!ts.length || !texto) return [{ texto, hit: false }];
  const alvo = normalizar(texto);
  const marca = new Array(texto.length).fill(false);
  for (const t of ts) {
    let from = 0, i: number;
    while ((i = alvo.indexOf(t, from)) >= 0) { for (let k = i; k < i + t.length; k++) marca[k] = true; from = i + t.length; }
  }
  const out: { texto: string; hit: boolean }[] = [];
  let buf = "", cur = marca[0] ?? false;
  for (let k = 0; k < texto.length; k++) {
    if (marca[k] === cur) buf += texto[k];
    else { out.push({ texto: buf, hit: cur }); buf = texto[k]; cur = marca[k]; }
  }
  if (buf) out.push({ texto: buf, hit: cur });
  return out;
}
