import { Page, expect, test as setup } from "@playwright/test";
import { domElementIds, frontRoutes } from "shared";
import { testConfig } from "../custom.config";

const { adminAuthFile, establishmentAuthFile, agencyAuthFile } = testConfig;

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/");
  const adminButton = await page.locator("#fr-header-main-navigation-button-4");
  await loginWithInclusionConnect(page, "admin");
  await expect(adminButton).toBeVisible();
  await page.context().storageState({ path: adminAuthFile });
});

setup("authenticate as IC user establishment", async ({ page }) => {
  await page.goto("/");
  await loginWithInclusionConnect(page, "establishmentDashboard");
  await expect(page.locator(".fr-tabs__list")).toBeVisible();
  await page.context().storageState({ path: establishmentAuthFile });
});

setup("authenticate as IC user agency", async ({ page }) => {
  await page.goto("/");
  await loginWithInclusionConnect(page, "agencyDashboard");
  await expect(
    page.locator(
      `#${domElementIds.agencyDashboard.registerAgencies.submitButton}`,
    ),
  ).toBeVisible();
  await page.context().storageState({ path: agencyAuthFile });
});

const loginWithInclusionConnect = async (
  page: Page,
  routeName: "agencyDashboard" | "establishmentDashboard" | "admin",
) => {
  const { loginButtonId, navLink, username, password, headerNavLink } =
    buttonByRouteName[routeName];

  if (routeName === "admin") {
    await page.goto("/admin");
    await expect(page.url()).toContain(frontRoutes[routeName]);
  } else {
    await page.goto("/");
    await page.click(`#${headerNavLink}`);
    await page.click(`#${navLink}`);
    await expect(page.url()).toContain(frontRoutes[routeName]);
  }

  const inclusionConnectButton = await page.locator(`#${loginButtonId}`);
  await expect(inclusionConnectButton).toBeVisible();

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
  expect(page.url()).toContain(frontRoutes[routeName]);
};

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
    headerNavLink?: string;
  }
> = {
  agencyDashboard: {
    loginButtonId: domElementIds.agencyDashboard.login.inclusionConnectButton,
    navLink: domElementIds.header.navLinks.agency.dashboard,
    username: testConfig.inclusionConnect.username,
    password: testConfig.inclusionConnect.password,
    headerNavLink: "fr-header-main-navigation-button-3",
  },
  establishmentDashboard: {
    loginButtonId:
      domElementIds.establishmentDashboard.login.inclusionConnectButton,
    navLink: domElementIds.header.navLinks.establishment.dashboard,
    username: testConfig.inclusionConnect.username,
    password: testConfig.inclusionConnect.password,
    headerNavLink: "fr-header-main-navigation-button-2",
  },
  admin: {
    loginButtonId: domElementIds.admin.login.inclusionConnectButton,
    navLink: domElementIds.header.navLinks.admin.backOffice,
    username: testConfig.inclusionConnect.adminUsername,
    password: testConfig.inclusionConnect.adminPassword,
  },
};
