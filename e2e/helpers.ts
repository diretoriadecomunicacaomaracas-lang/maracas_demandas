import { Page, expect } from "@playwright/test";
export const SENHA = "Homolog@2026";
export async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/app\/|\/portal|\/grafica/);
}
