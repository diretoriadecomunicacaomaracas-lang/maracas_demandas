import { describe, it, expect } from "vitest";
import { validarLiberacaoImpressao, podeLiberarImpressao, type EstadoLiberacao } from "@/lib/impressao";

const base: EstadoLiberacao = {
  versaoVigente: true, versaoEstado: "aprovada",
  aprovacaoCoordenadorAtiva: true, aprovacaoDiretorAtiva: true, aprovacoesMesmaVersao: true,
  graficaSelecionada: true, quantidade: "5000", medidas: "15x21", formato: "A5",
  material: "Couché 150g", acabamento: "4/4", prazoInformado: true, localEntrega: "Sede",
  existeLiberacaoIncompativel: false,
};

describe("validação de liberar impressão (checklist obrigatório)", () => {
  it("libera quando tudo está completo", () => {
    expect(podeLiberarImpressao(base)).toBe(true);
    expect(validarLiberacaoImpressao(base)).toHaveLength(0);
  });
  it("bloqueia sem a segunda aprovação", () => {
    expect(podeLiberarImpressao({ ...base, aprovacaoDiretorAtiva: false })).toBe(false);
  });
  it("bloqueia se a versão não é vigente/está substituída", () => {
    expect(podeLiberarImpressao({ ...base, versaoVigente: false })).toBe(false);
    expect(podeLiberarImpressao({ ...base, versaoEstado: "substituida" })).toBe(false);
  });
  it("exige ficha técnica (gráfica, quantidade, medidas/formato, material, acabamento, prazo, local)", () => {
    expect(validarLiberacaoImpressao({ ...base, graficaSelecionada: false })).toContain("Selecione a gráfica responsável.");
    expect(validarLiberacaoImpressao({ ...base, quantidade: "" })).toContain("Informe a quantidade.");
    expect(validarLiberacaoImpressao({ ...base, medidas: "", formato: "" })).toContain("Informe medidas ou formato.");
    expect(validarLiberacaoImpressao({ ...base, localEntrega: "" })).toContain("Informe o local de entrega.");
  });
  it("bloqueia se há liberação incompatível em outra versão", () => {
    expect(podeLiberarImpressao({ ...base, existeLiberacaoIncompativel: true })).toBe(false);
  });
});
