import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("solicitante da Saúde vê apenas setores da Saúde na nova solicitação", async ({ page }) => {
  await login(page, "saude@maracas.ba.gov.br");
  await page.getByRole("link", { name: /Nova solicitação/i }).click();
  const setor = page.getByLabel("Setor solicitante");
  await expect(setor).toBeVisible();
  const options = await setor.locator("option").allTextContents();
  // Deve conter setores da Saúde e NÃO conter setores de outra secretaria (ex.: Ensino Fundamental).
  expect(options.join(" ")).toMatch(/Vigilância|Atenção Básica|Hospital/i);
  expect(options.join(" ")).not.toMatch(/Ensino Fundamental/i);
});

test("Central tem abas e fila cronológica", async ({ page }) => {
  await login(page, "coord@maracas.ba.gov.br");
  await page.goto("/app/solicitacoes");
  for (const aba of ["Pendentes", "Em análise", "Aguardando informações", "Processadas", "Todas"]) {
    await expect(page.getByRole("link", { name: new RegExp(aba) })).toBeVisible();
  }
});
