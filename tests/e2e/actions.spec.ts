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

test("admin puede registrar entrada de stock sin error RLS", async ({ page }) => {
  await login(page, adminEmail, adminPassword);
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto("/dashboard/materiales");

  const [response] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/dashboard/materiales") &&
        res.request().method() === "POST"
    ),
    page.getByRole("button", { name: /entrada/i }).first().click(),
  ]);

  expect(response.status()).toBeLessThan(400);
  await expect(page.getByText(/disponible:/i).first()).toBeVisible();
});

test("representante puede pedir y devolver material", async ({ page }) => {
  await login(page, repEmail, repPassword);
  await expect(page).toHaveURL(/\/equipo/);

  const [pedirResponse] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/equipo") && res.request().method() === "POST"
    ),
    page.getByRole("button", { name: /^pedir$/i }).first().click(),
  ]);
  expect(pedirResponse.status()).toBeLessThan(400);

  await expect(page.getByText("Activo").first()).toBeVisible();

  const [devolverResponse] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/equipo") && res.request().method() === "POST"
    ),
    page.getByRole("button", { name: /^devolver$/i }).first().click(),
  ]);
  expect(devolverResponse.status()).toBeLessThan(400);
});
