import { describe, it, expect } from "vitest";
import { estaAtrasada } from "@/lib/statuses";
import { respeita24h } from "@/lib/dates";

describe("regras temporais (v2.2)", () => {
  it("atraso é indicador calculado (não status) e ignora etapas terminais", () => {
    const ontem = new Date(Date.now() - 2 * 86400000);
    expect(estaAtrasada(ontem, "criacao")).toBeGreaterThan(0);
    expect(estaAtrasada(ontem, "finalizado")).toBe(0);
  });
  it("solicitação externa exige 24h de antecedência", () => {
    const em12h = new Date(Date.now() + 12 * 3600 * 1000);
    const em25h = new Date(Date.now() + 25 * 3600 * 1000);
    expect(respeita24h(em12h)).toBe(false);
    expect(respeita24h(em25h)).toBe(true);
  });
});
