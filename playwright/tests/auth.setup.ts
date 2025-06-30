import { type Page, expect, test as setup } from "@playwright/test";
import { domElementIds, frontRoutes } from "shared";
import { testConfig } from "../custom.config";

const { adminAuthFile, establishmentAuthFile, agencyAuthFile } = testConfig;

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/");
  const adminButton = await page.locator("#fr-header-main-navigation-button-4");
  await loginWithIdentityProvider(page, "admin", "ProConnect");
  await expect(adminButton).toBeVisible();
  await page.context().storageState({ path: adminAuthFile });
});

setup("authenticate as IC user establishment", async ({ page }) => {
  await page.goto("/");
  await loginWithIdentityProvider(page, "establishmentDashboard", "ProConnect");
  await expect(page.locator(".fr-tabs__list")).toBeVisible();
  await page.context().storageState({ path: establishmentAuthFile });
});

setup("authenticate as IC user agency", async ({ page }) => {
  await page.goto("/");

  await loginWithIdentityProvider(page, "agencyDashboard", "ProConnect");
  await expect(
    page.locator(`#${domElementIds.agencyDashboard.registerAgencies.search}`),
  ).toBeVisible();

  await page.context().storageState({ path: agencyAuthFile });
});

type ProviderMode = "ProConnect" | "InclusionConnect";

const loginWithIdentityProvider = async (
  page: Page,
  routeName: "agencyDashboard" | "establishmentDashboard" | "admin",
  identityProviderMode: ProviderMode,
) => {
  const {
    proConnectLoginButtonId,
    navLink,
    username,
    password,
    headerNavLink,
  } = buttonByRouteName(identityProviderMode)[routeName];

  if (routeName === "admin") {
    await page.goto("/admin");
    await expect(page.url()).toContain(frontRoutes[routeName]);
  } else {
    await page.goto("/");
    await page.click(`#${headerNavLink}`);
    await page.click(`#${navLink}`);
    await expect(page.url()).toContain(frontRoutes[routeName]);
  }

  const currentPage = await page.url();

  const authButton = await page.locator(`#${proConnectLoginButtonId} .fr-btn`);
  await expect(authButton).toBeVisible();

  await authButton.click();
  await page.waitForURL(
    `${getAuthEnvVarByIdentityProviderMode(identityProviderMode).baseUrl}/**`,
  );
  await page.waitForLoadState("domcontentloaded");
  await page.waitForSelector("input[name=email]");
  await page.fill("input[name=email]", username);

  if (identityProviderMode === "ProConnect")
    await page
      .locator("button[type='submit']")
      .getByText("Continuer", {
        exact: false,
      })
      .click();

  await page.fill("input[name=password]", password);

  identityProviderMode === "ProConnect"
    ? await page.getByRole("button", { name: /identifier/ }).click()
    : await page
        .locator("button[type='submit']")
        .getByText("Connexion", {
          exact: false,
        })
        .click();

  await page.waitForURL(currentPage);
  expect(page.url()).toContain(frontRoutes[routeName]);
};

type InclusionConnectRoute =
  | "agencyDashboard"
  | "establishmentDashboard"
  | "admin";

const buttonByRouteName = (
  identityProviderMode: ProviderMode,
): Record<
  InclusionConnectRoute,
  {
    proConnectLoginButtonId: string;
    navLink: string;
    username: string;
    password: string;
    headerNavLink?: string;
  }
> => {
  const { username, password, adminUsername, adminPassword } =
    getAuthEnvVarByIdentityProviderMode(identityProviderMode);

  return {
    agencyDashboard: {
      proConnectLoginButtonId:
        domElementIds.agencyDashboard.login.proConnectButton,
      navLink: domElementIds.header.navLinks.agency.dashboard,
      username,
      password,
      headerNavLink: "fr-header-main-navigation-button-3",
    },
    establishmentDashboard: {
      proConnectLoginButtonId:
        domElementIds.establishmentDashboard.login.proConnectButton,
      navLink: domElementIds.header.navLinks.establishment.dashboard,
      username,
      password,
      headerNavLink: "fr-header-main-navigation-button-2",
    },
    admin: {
      proConnectLoginButtonId: domElementIds.admin.login.proConnectButton,
      navLink: domElementIds.header.navLinks.admin.backOffice,
      username: adminUsername,
      password: adminPassword,
    },
  };
};

const getAuthEnvVarByIdentityProviderMode = (identityProviderMode: string) =>
  testConfig[
    identityProviderMode === "InclusionConnect"
      ? "inclusionConnect"
      : "proConnect"
  ];
