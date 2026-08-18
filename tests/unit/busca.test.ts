import { describe, it, expect } from "vitest";
import { normalizar, casa, tokens, trecho } from "@/domain/busca";

describe("busca — normalização e casamento", () => {
  it("normaliza caixa e acentos", () => {
    expect(normalizar("Manutenção da EDUCAÇÃO Ré")).toBe("manutencao da educacao re");
  });
  it("casa sem acento e sem caixa", () => {
    expect(casa("Manutenção da educação", "MANUTENCAO educacao")).toBe(true);
  });
  it("casa parte de palavra", () => {
    expect(casa("#PrefeituraDeMaracas oficial", "maraca")).toBe(true);
  });
  it("exige todas as palavras (multi-termo)", () => {
    expect(casa("abastecimento por carro pipa", "carro pipa abastecimento")).toBe(true);
    expect(casa("abastecimento apenas", "carro pipa")).toBe(false);
  });
  it("protocolo parcial", () => {
    expect(casa("2026-0142", "0142")).toBe(true);
  });
  it("tokens ignora espaços extras", () => {
    expect(tokens("  carro   pipa ")).toEqual(["carro", "pipa"]);
  });
  it("trecho traz contexto ao redor do termo", () => {
    const t = trecho("O contrato de abastecimento por carro-pipa foi renovado.", "carro");
    expect(t.toLowerCase()).toContain("carro");
  });
});
