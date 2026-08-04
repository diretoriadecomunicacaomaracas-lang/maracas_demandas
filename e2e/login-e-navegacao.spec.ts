import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("interno faz login e navega pelo menu", async ({ page }) => {
  await login(page, "coord@maracas.ba.gov.br");
  await expect(page).toHaveURL(/\/app\/painel/);
  for (const item of ["Solicitações", "Demandas", "Calendário", "Conversas"]) {
    await page.getByRole("navigation").getByText(item, { exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("solicitante vai ao Portal do Solicitante", async ({ page }) => {
  await login(page, "saude@maracas.ba.gov.br");
  await expect(page).toHaveURL(/\/portal/);
  await expect(page.getByRole("heading", { name: /Minhas solicitações/i })).toBeVisible();
});

test("grafica vai ao Portal da Gráfica", async ({ page }) => {
  await login(page, "grafica@boaimpressao.com.br");
  await expect(page).toHaveURL(/\/grafica/);
  await expect(page.getByRole("heading", { name: /Meus pedidos/i })).toBeVisible();
});
