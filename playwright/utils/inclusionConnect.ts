import { Page, expect } from "@playwright/test";
import { testConfig } from "../custom.config";

import { domElementIds, frontRoutes } from "shared";

export const loginWithInclusionConnect = async (
  page: Page,
  routeName: "agencyDashboard" | "establishmentDashboard",
) => {
  await page.goto("/");
  await page.click("#fr-header-main-navigation-button-3");
  await page.click(
    `#${
      domElementIds.header.navLinks[
        routeName === "agencyDashboard" ? "agency" : "establishment"
      ].dashboard
    }`,
  );
  await expect(page.url()).toContain(frontRoutes[routeName]);
  const inclusionConnectButton = page.locator(
    `#${domElementIds[routeName].login.inclusionConnectButton}`,
  );
  await expect(await inclusionConnectButton).toBeVisible();
  await inclusionConnectButton.click();
  await page.waitForURL(`${testConfig.inclusionConnect.baseUrl}/**`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForSelector("input[name=email]");
  await page.fill("input[name=email]", testConfig.inclusionConnect.username);
  await page.fill("input[name=password]", testConfig.inclusionConnect.password);
  await page
    .locator("button[type='submit']")
    .getByText("Connexion", {
      exact: false,
    })
    .click();
  await page.waitForURL(`${frontRoutes[routeName]}**`);
  await expect(page.url()).toContain(frontRoutes[routeName]);
};
