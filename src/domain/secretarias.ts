// Agrupamento oficial das secretarias (Rodada 1). "Gabinete" reúne 4 pastas.
// O mapeamento é por correspondência de nome normalizado (tolerante a acento/caixa).
import { normalizar } from "./busca";

export type GrupoSecretaria = { chave: string; nome: string; inclui: string[] };

export const GRUPOS_SECRETARIA: GrupoSecretaria[] = [
  { chave: "gabinete", nome: "Gabinete", inclui: [
    "Gabinete", "Gabinete do Prefeito", "Secretaria de Governo",
    "Secretaria de Planejamento", "Secretaria de Administração e Finanças",
    "Administração e Finanças", "Governo", "Planejamento",
  ] },
  { chave: "saude", nome: "Secretaria de Saúde", inclui: ["Saúde", "Secretaria de Saúde"] },
  { chave: "educacao", nome: "Secretaria de Educação", inclui: ["Educação", "Secretaria de Educação"] },
  { chave: "infraestrutura", nome: "Secretaria de Infraestrutura", inclui: ["Infraestrutura", "Secretaria de Infraestrutura", "Obras"] },
  { chave: "desenv_social", nome: "Secretaria de Desenvolvimento Social", inclui: ["Desenvolvimento Social", "Assistência Social", "Ação Social"] },
  { chave: "agricultura", nome: "Secretaria de Desenvolvimento, Agricultura e Meio Ambiente", inclui: [
    "Agricultura", "Meio Ambiente", "Desenvolvimento, Agricultura e Meio Ambiente", "Desenvolvimento Agricultura",
  ] },
  { chave: "cultura", nome: "Secretaria de Cultura, Esporte, Lazer e Turismo", inclui: [
    "Cultura", "Esporte", "Lazer", "Turismo", "Cultura, Esporte, Lazer e Turismo",
  ] },
];

const OUTRAS: GrupoSecretaria = { chave: "outras", nome: "Outras", inclui: [] };

// Retorna o grupo oficial para o nome de uma secretaria (ou "Outras").
export function grupoDaSecretaria(nomeSecretaria: string | null | undefined): GrupoSecretaria {
  const n = normalizar(nomeSecretaria);
  if (!n) return OUTRAS;
  for (const g of GRUPOS_SECRETARIA) {
    for (const termo of g.inclui) {
      const t = normalizar(termo);
      if (n === t || n.includes(t) || t.includes(n)) return g;
    }
  }
  return OUTRAS;
}

// Soma contagens {secretariaNome -> n} nos 7 grupos oficiais (ordem fixa).
export function agruparPorSecretaria(contagens: { nome: string; total: number }[]): { chave: string; nome: string; total: number }[] {
  const mapa = new Map<string, number>();
  for (const g of GRUPOS_SECRETARIA) mapa.set(g.chave, 0);
  let temOutras = false;
  for (const c of contagens) {
    const g = grupoDaSecretaria(c.nome);
    if (g.chave === "outras") temOutras = true;
    mapa.set(g.chave, (mapa.get(g.chave) ?? 0) + c.total);
  }
  const base = GRUPOS_SECRETARIA.map((g) => ({ chave: g.chave, nome: g.nome, total: mapa.get(g.chave) ?? 0 }));
  if (temOutras) base.push({ chave: "outras", nome: "Outras", total: mapa.get("outras") ?? 0 });
  return base;
}
