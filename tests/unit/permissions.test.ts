import { describe, it, expect } from "vitest";
import { can, podeLiberarImpressao, ambienteDestino, permissoesDe } from "@/lib/permissions";

describe("permissões (v2.2)", () => {
  it("diretor pode aprovar digital e liberar publicação", () => {
    expect(can(["diretor"], "aprovar_digital")).toBe(true);
    expect(can(["diretor"], "liberar_publicacao")).toBe(true);
  });
  it("coordenador NÃO altera permissões críticas do sistema", () => {
    expect(can(["coordenador"], "alterar_permissoes")).toBe(false);
  });
  it("designer movimenta produção mas NÃO aprova", () => {
    expect(can(["designer"], "movimentar_producao")).toBe(true);
    expect(can(["designer"], "aprovar_digital")).toBe(false);
  });
  it("solicitante e visualizador não têm permissões de ação", () => {
    expect(permissoesDe(["solicitante"]).size).toBe(0);
    expect(permissoesDe(["visualizador"]).size).toBe(0);
  });
  it("impresso exige aprovação de coordenador E diretor na mesma versão", () => {
    expect(podeLiberarImpressao([{ cargo: "coordenador" }])).toBe(false);
    expect(podeLiberarImpressao([{ cargo: "coordenador" }, { cargo: "diretor" }])).toBe(true);
  });
  it("acúmulo de cargos leva ao ambiente interno mais completo", () => {
    expect(ambienteDestino(["solicitante","designer"])).toBe("interno");
    expect(ambienteDestino(["grafica"])).toBe("grafica");
    expect(ambienteDestino(["solicitante"])).toBe("solicitante");
  });
});
