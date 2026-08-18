import { describe, it, expect } from "vitest";
import { cargaElevada, LIMITES_CARGA } from "@/domain/carga";

describe("carga elevada (indicador operacional)", () => {
  it("6+ ativas sinaliza", () => {
    const r = cargaElevada({ ativas: 6, atrasadas: 0 });
    expect(r.elevada).toBe(true); expect(r.motivo).toContain("ativas");
  });
  it("3+ atrasadas sinaliza", () => {
    expect(cargaElevada({ ativas: 2, atrasadas: 3 }).elevada).toBe(true);
  });
  it("abaixo dos limites não sinaliza", () => {
    expect(cargaElevada({ ativas: 5, atrasadas: 2 }).elevada).toBe(false);
  });
  it("limites são constantes ajustáveis", () => {
    expect(LIMITES_CARGA.ativasMin).toBe(6); expect(LIMITES_CARGA.atrasadasMin).toBe(3);
  });
});
