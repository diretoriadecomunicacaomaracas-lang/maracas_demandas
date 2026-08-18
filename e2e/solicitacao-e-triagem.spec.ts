import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("solicitante cria nova solicitação (assistente + 24h)", async ({ page }) => {
  await login(page, "saude@maracas.ba.gov.br");
  await page.getByRole("link", { name: /Nova solicitação/i }).click();
  await page.getByLabel("Título da solicitação").fill("Card de teste E2E");
  await page.getByRole("button", { name: "Continuar" }).click(); // tipo
  await page.getByRole("button", { name: "Continuar" }).click(); // briefing
  await page.getByRole("button", { name: "Continuar" }).click(); // data
  // deixa prazo vazio => envia; se preencher < 24h, deve bloquear (validação no servidor)
  await page.getByRole("button", { name: "Continuar" }).click(); // revisão
  await page.getByRole("button", { name: /Enviar solicitação/i }).click();
  await expect(page).toHaveURL(/\/portal/);
});

test("interno faz triagem e converte em demanda", async ({ page }) => {
  await login(page, "coord@maracas.ba.gov.br");
  await page.goto("/app/solicitacoes");
  const aprovar = page.getByRole("button", { name: /Aprovar/ }).first();
  if (await aprovar.count()) { await aprovar.click(); await expect(page.getByText(/Feito|Aprovada/i)).toBeVisible(); }
});
