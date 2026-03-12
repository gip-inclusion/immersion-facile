import { defineConfig, devices } from "@playwright/test";
import { e2eBackendEnv, frontPort } from "./e2e-backend-env";

/**
 * See https://playwright.dev/docs/test-configuration.
 */

const backPort = 1234;
const baseURL = process.env.BASE_URL || `http://localhost:${frontPort}`;

const secrets = {
  PC_USERNAME: process.env.PC_USERNAME!,
  PC_PASSWORD: process.env.PC_PASSWORD!,
  PC_ADMIN_PASSWORD: process.env.PC_ADMIN_PASSWORD!,
  PRO_CONNECT_CLIENT_SECRET: process.env.PRO_CONNECT_CLIENT_SECRET!,
  SIRENE_INSEE_CLIENT_ID: process.env.SIRENE_INSEE_CLIENT_ID!,
  SIRENE_INSEE_CLIENT_SECRET: process.env.SIRENE_INSEE_CLIENT_SECRET!,
  SIRENE_INSEE_USERNAME: process.env.SIRENE_INSEE_USERNAME!,
  SIRENE_INSEE_PASSWORD: process.env.SIRENE_INSEE_PASSWORD!,
  API_KEY_OPEN_CAGE_DATA_GEOCODING:
    process.env.API_KEY_OPEN_CAGE_DATA_GEOCODING!,
  API_KEY_OPEN_CAGE_DATA_GEOSEARCH:
    process.env.API_KEY_OPEN_CAGE_DATA_GEOSEARCH!,
};

const backendEnv = {
  ...e2eBackendEnv,
  PC_USERNAME: secrets.PC_USERNAME,
  PC_PASSWORD: secrets.PC_PASSWORD,
  PC_ADMIN_PASSWORD: secrets.PC_ADMIN_PASSWORD,
  PRO_CONNECT_CLIENT_SECRET: secrets.PRO_CONNECT_CLIENT_SECRET,
  API_KEY_OPEN_CAGE_DATA_GEOCODING: secrets.API_KEY_OPEN_CAGE_DATA_GEOCODING,
  API_KEY_OPEN_CAGE_DATA_GEOSEARCH: secrets.API_KEY_OPEN_CAGE_DATA_GEOSEARCH,
  SIRENE_INSEE_CLIENT_ID: secrets.SIRENE_INSEE_CLIENT_ID,
  SIRENE_INSEE_CLIENT_SECRET: secrets.SIRENE_INSEE_CLIENT_SECRET,
  SIRENE_INSEE_USERNAME: secrets.SIRENE_INSEE_USERNAME,
  SIRENE_INSEE_PASSWORD: secrets.SIRENE_INSEE_PASSWORD,
  DATABASE_URL: process.env.E2E_DATABASE_URL ?? "",
};

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 4,
  reporter: process.env.CI ? [["github"], ["html"], ["line"]] : "html",
  use: {
    baseURL,
    screenshot: {
      mode: "only-on-failure",
      fullPage: true,
    },
    storageState: "./data/storageState.json",
    trace: "retain-on-failure",
  },
  timeout: process.env.CI ? 60_000 : 30_000,
  expect: {
    timeout: process.env.CI ? 10_000 : 8_000,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: [
    {
      command: "pnpm back dev:no-typecheck",
      url: `http://localhost:${backPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      cwd: "..",
      env: backendEnv,
    },
    {
      command: "pnpm front dev",
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      cwd: "..",
      env: {
        PORT: frontPort.toString(),
        VITE_GATEWAY: "HTTP",
        VITE_ENV_TYPE: "local",
        VITE_PREFILLED_FORMS: "true",
        VITE_CRISP_WEBSITE_ID: "test",
        VITE_RELEASE_TAG: "v0",
      },
    },
  ],
});
