import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { frontRoutes } from "shared";

test.describe("Axe detect accessibility issues on main pages", () => {
  test("Home", async ({ page }, testInfo) => {
    await page.goto("/");
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    await testInfo.attach("accessibility-scan-results", {
      body: JSON.stringify(accessibilityScanResults, null, 2),
      contentType: "application/json",
    });
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  test("Search", async ({ page }) => {
    await page.goto(frontRoutes.search);
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Convention form", async ({ page }) => {
    await page.goto(frontRoutes.conventionImmersionRoute);
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(
      accessibilityScanResults.violations.filter(
        // issues on convention form due to accordion not being open at the time of the scan and react-select aria-describedby
        (violation) =>
          violation.id !== "label" &&
          violation.id !== "label-title-only" &&
          violation.id !== "has-visible-text" &&
          violation.id !== "hidden-explicit-label",
      ),
    ).toEqual([]);
  });

  test("Add agency form", async ({ page }) => {
    await page.goto(frontRoutes.addAgency);
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Form establishment", async ({ page }) => {
    await page.goto(frontRoutes.establishment);
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
