import { expect, test } from "@playwright/test";

test.describe("ProConnect workflow", () => {
  test.skip("Can access establishment dashboard", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Mon espace" }).click();
    await page.getByRole("link", { name: "Je suis une entreprise" }).click();
    await page
      .getByRole("link", { name: "S’identifier avec ProConnect" })
      .click();
    await page.getByLabel("Email professionnel").click();
    await page.getByLabel("Email professionnel").fill("user@yopmail.com");
    await page.getByTestId("interaction-connection-button").click();
    await page
      .getByLabel("Renseignez votre mot de passe")
      .fill("user@yopmail.com");
    await page.getByRole("button", { name: "S’identifier" }).click();
    await page.getByLabel("Direction interministerielle").click();
    await expect(
      page.getByRole("heading", { name: "Bienvenue" }),
    ).toBeVisible();
  });
});
