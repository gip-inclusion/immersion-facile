import { Page, expect } from "@playwright/test";
import { domElementIds, frontRoutes } from "shared";
import { testConfig } from "../custom.config";

type InclusionConnectRoute =
  | "agencyDashboard"
  | "establishmentDashboard"
  | "admin";

const buttonByRouteName: Record<
  InclusionConnectRoute,
  {
    loginButtonId: string;
    navLink: string;
    username: string;
    password: string;
  }
> = {
  agencyDashboard: {
    loginButtonId: domElementIds.agencyDashboard.login.inclusionConnectButton,
    navLink: domElementIds.header.navLinks.agency.dashboard,
    username: testConfig.inclusionConnect.username,
    password: testConfig.inclusionConnect.password,
  },
  establishmentDashboard: {
    loginButtonId:
      domElementIds.establishmentDashboard.login.inclusionConnectButton,
    navLink: domElementIds.header.navLinks.establishment.dashboard,
    username: testConfig.inclusionConnect.username,
    password: testConfig.inclusionConnect.password,
  },
  admin: {
    loginButtonId: domElementIds.admin.login.inclusionConnectButton,
    navLink: domElementIds.header.navLinks.admin.backOffice,
    username: testConfig.inclusionConnect.adminUsername,
    password: testConfig.inclusionConnect.adminPassword,
  },
};

export const loginWithInclusionConnect = async (
  page: Page,
  routeName: "agencyDashboard" | "establishmentDashboard" | "admin",
) => {
  const { loginButtonId, navLink, username, password } =
    buttonByRouteName[routeName];

  if (routeName === "admin") {
    await page.goto("/admin");
    await expect(page.url()).toContain(frontRoutes[routeName]);
  } else {
    await page.goto("/");
    await page.click("#fr-header-main-navigation-button-3");
    await page.click(`#${navLink}`);
    await expect(page.url()).toContain(frontRoutes[routeName]);
  }

  const inclusionConnectButton = page.locator(`#${loginButtonId}`);
  await expect(await inclusionConnectButton).toBeVisible();

  await inclusionConnectButton.click();
  await page.waitForURL(`${testConfig.inclusionConnect.baseUrl}/**`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForSelector("input[name=email]");
  await page.fill("input[name=email]", username);
  await page.fill("input[name=password]", password);
  await page
    .locator("button[type='submit']")
    .getByText("Connexion", {
      exact: false,
    })
    .click();
  await page.waitForURL(`${frontRoutes[routeName]}**`);
  await expect(page.url()).toContain(frontRoutes[routeName]);
};
