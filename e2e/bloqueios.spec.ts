import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("solicitante NÃO acessa ambiente interno pela URL", async ({ page }) => {
  await login(page, "saude@maracas.ba.gov.br");
  await page.goto("/app/demandas");
  await expect(page).not.toHaveURL(/\/app\/demandas/); // middleware/guard redireciona
});

test("usuário sem permissão NÃO acessa Administração", async ({ page }) => {
  await login(page, "designer@maracas.ba.gov.br");
  await page.goto("/app/admin");
  await expect(page).toHaveURL(/\/app\/painel/); // guard por permissão
});
