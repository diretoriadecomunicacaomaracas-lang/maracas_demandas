import { test, expect } from "@playwright/test";
import { login } from "./helpers";
// Kanban: mover cartão dispara validação no servidor; movimento inválido reverte com aviso.
test("kanban carrega colunas", async ({ page }) => {
  await login(page, "coord@maracas.ba.gov.br");
  await page.goto("/app/demandas/kanban");
  await expect(page.getByRole("list", { name: "Planejamento" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Em criação" })).toBeVisible();
});
