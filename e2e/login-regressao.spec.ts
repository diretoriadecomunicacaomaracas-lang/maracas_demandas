import { test, expect } from "@playwright/test";
import { login, SENHA } from "./helpers";

// Regressão de login: valida o VISUAL (Tailwind/design system aplicado de fato,
// via estilo computado) + a AUTENTICAÇÃO e redirecionamento por perfil + logout.

test("1) /login carrega com o layout estilizado (Tailwind aplicado)", async ({ page }) => {
  await page.goto("/login");

  // Elementos principais presentes
  await expect(page.getByRole("heading", { name: /Bem-vindo/i })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
  await expect(page.getByRole("link", { name: /Esqueci minha senha/i })).toBeVisible();

  const botao = page.getByRole("button", { name: "Entrar" });
  await expect(botao).toBeVisible();

  // PROVA de que o CSS do design system está aplicado (não é HTML cru):
  // o botão primário deve ter o azul da marca (#028EFF = rgb(2, 142, 255)).
  const bg = await botao.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe("rgb(2, 142, 255)");

  // O card de login deve ter cantos arredondados (design system aplicado).
  const radius = await page.locator("form").evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
  expect(parseFloat(radius)).toBeGreaterThan(8);
  // E fundo branco do card (não transparente = CSS carregado).
  const cardBg = await page.locator("form").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(cardBg).toBe("rgb(255, 255, 255)");
});

test("2) formulário aceita credenciais digitadas", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("coord@maracas.ba.gov.br");
  await page.getByLabel("Senha").fill(SENHA);
  await expect(page.getByLabel("E-mail")).toHaveValue("coord@maracas.ba.gov.br");
  await expect(page.getByLabel("Senha")).toHaveValue(SENHA);
});

test("3) Coordenador autentica e vai ao ambiente interno", async ({ page }) => {
  await login(page, "coord@maracas.ba.gov.br");
  await expect(page).toHaveURL(/\/app\/painel/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("4) Solicitante autentica e vai ao Portal do Solicitante", async ({ page }) => {
  await login(page, "saude@maracas.ba.gov.br");
  await expect(page).toHaveURL(/\/portal/);
});

test("5) logout retorna para /login", async ({ page }) => {
  await login(page, "coord@maracas.ba.gov.br");
  await page.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole("menuitem", { name: /Sair da conta/i }).click();
  await page.waitForURL(/\/login/);
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});
