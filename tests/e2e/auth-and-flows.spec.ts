import { expect, test } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@cecyte.edu.mx";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "Admin123!";
const repEmail = process.env.E2E_REP_EMAIL ?? "rep1@cecyte.edu.mx";
const repPassword = process.env.E2E_REP_PASSWORD ?? "Rep12345!";

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo institucional").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: /iniciar sesión/i }).click();
}

test("admin puede entrar al dashboard", async ({ page }) => {
  await login(page, adminEmail, adminPassword);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /panel de administración/i })).toBeVisible();
});

test("representante entra a su vista de equipo", async ({ page }) => {
  await login(page, repEmail, repPassword);
  await expect(page).toHaveURL(/\/equipo/);
  await expect(page.getByRole("heading", { name: /pedir material/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /mis préstamos activos/i })).toBeVisible();
});
