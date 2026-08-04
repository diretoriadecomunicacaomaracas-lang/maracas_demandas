import { test, expect } from "@playwright/test";
// Fumaça: rota protegida redireciona para /login quando não autenticado.
test("rota interna exige login", async ({ page }) => {
  await page.goto("/app/painel");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: /Bem-vindo/i })).toBeVisible();
});
