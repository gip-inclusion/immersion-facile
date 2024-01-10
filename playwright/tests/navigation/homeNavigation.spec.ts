import { expect, test } from "@playwright/test";
import { domElementIds, frontRoutes } from "shared";

test.describe("Home user flow", () => {
  const userTypes = ["candidate", "establishment", "agency"] as const;

  userTypes.forEach((type) => {
    test(`Should change theme based on user type ${type}`, async ({ page }) => {
      await page.goto("/");
      await page.click(`#${domElementIds.home.heroHeader[type]}`);
      await expect(page.locator(`.im-hero-header--${type}`)).toBeDefined();
    });
  });

  test("User flow: Candidate -> search", async ({ page }) => {
    await page.goto("/");
    await page.click(`#${domElementIds.home.heroHeader.candidate}`);
    await page.click(`#${domElementIds.homeCandidates.heroHeader.search}`);
    await expect(page).toHaveURL(`/${frontRoutes.search}`);
  });

  test("User flow: Candidate -> convention form", async ({ page }) => {
    await page.goto("/");
    await page.click(`#${domElementIds.home.heroHeader.candidate}`);
    await page.click(
      `#${domElementIds.homeCandidates.heroHeader.formConvention}`,
    );
    await page.click(
      `#${domElementIds.conventionImmersionRoute.showFormButton}`,
    );
    await expect(page.url()).toContain(
      `/${frontRoutes.conventionImmersionRoute}`,
    );
  });

  test("User flow: Establishment -> convention form", async ({ page }) => {
    await page.goto("/");
    await page.click(`#${domElementIds.home.heroHeader.establishment}`);
    await page.click(
      `#${domElementIds.homeEstablishments.heroHeader.formConvention}`,
    );
    await expect(page).toHaveURL(`/${frontRoutes.conventionImmersionRoute}`);
  });

  test("User flow: Agency -> register form", async ({ page }) => {
    await page.goto("/");
    await page.click(`#${domElementIds.home.heroHeader.agency}`);
    await page.click(`#${domElementIds.homeAgencies.heroHeader.addAgencyForm}`);
    await expect(page).toHaveURL(`/${frontRoutes.addAgency}`);
  });

  test("User flow: Agency -> convention form", async ({ page }) => {
    await page.goto("/");
    await page.click(`#${domElementIds.home.heroHeader.agency}`);
    await page.click(
      `#${domElementIds.homeAgencies.heroHeader.formConvention}`,
    );
    await expect(page).toHaveURL(`/${frontRoutes.conventionImmersionRoute}`);
  });
});
