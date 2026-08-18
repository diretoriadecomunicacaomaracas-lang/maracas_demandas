import { describe, it, expect } from "vitest";
import { grupoDaSecretaria, agruparPorSecretaria } from "@/domain/secretarias";

describe("agrupamento de secretarias (7 grupos oficiais)", () => {
  it("Gabinete reúne as 4 pastas", () => {
    expect(grupoDaSecretaria("Gabinete do Prefeito").chave).toBe("gabinete");
    expect(grupoDaSecretaria("Secretaria de Governo").chave).toBe("gabinete");
    expect(grupoDaSecretaria("Secretaria de Planejamento").chave).toBe("gabinete");
    expect(grupoDaSecretaria("Secretaria de Administração e Finanças").chave).toBe("gabinete");
  });
  it("mapeia pastas próprias", () => {
    expect(grupoDaSecretaria("Secretaria de Saúde").chave).toBe("saude");
    expect(grupoDaSecretaria("Educação").chave).toBe("educacao");
    expect(grupoDaSecretaria("Cultura, Esporte, Lazer e Turismo").chave).toBe("cultura");
  });
  it("desconhecida vira Outras", () => {
    expect(grupoDaSecretaria("Secretaria Fantasma").chave).toBe("outras");
  });
  it("soma contagens nos grupos", () => {
    const r = agruparPorSecretaria([
      { nome: "Secretaria de Governo", total: 2 },
      { nome: "Secretaria de Planejamento", total: 3 },
      { nome: "Secretaria de Saúde", total: 4 },
    ]);
    expect(r.find((g) => g.chave === "gabinete")!.total).toBe(5);
    expect(r.find((g) => g.chave === "saude")!.total).toBe(4);
  });
});
