import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotEnv from "dotenv";
import { e2eBackendEnv, frontPort } from "./e2e-backend-env";

/**
 * See https://playwright.dev/docs/test-configuration.
 */

const backPort = 1234;
const baseURL = process.env.BASE_URL || `http://localhost:${frontPort}`;

const loadEnvFile = (path: string): Record<string, string> => {
  const merged: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env))
    if (value !== undefined) merged[key] = value;
  return {
    ...merged,
    ...(dotEnv.config({ path, processEnv: {} }).parsed ?? {}),
  };
};

const playwrightEnv = loadEnvFile(resolve(__dirname, ".env"));
const backendEnv = loadEnvFile(resolve(__dirname, "../back/.env"));

const backWebServerEnv = {
  ...e2eBackendEnv,
  PC_USERNAME:
    playwrightEnv.PC_USERNAME ??
    "recette+playwright@immersion-facile.beta.gouv.fr",
  PC_PASSWORD: playwrightEnv.PC_PASSWORD ?? "password123",
  PC_ADMIN_PASSWORD: playwrightEnv.PC_ADMIN_PASSWORD ?? "password123",
  PRO_CONNECT_CLIENT_SECRET: backendEnv.PRO_CONNECT_CLIENT_SECRET,
  API_KEY_OPEN_CAGE_DATA_GEOCODING: backendEnv.API_KEY_OPEN_CAGE_DATA_GEOCODING,
  API_KEY_OPEN_CAGE_DATA_GEOSEARCH: backendEnv.API_KEY_OPEN_CAGE_DATA_GEOSEARCH,
  SIRENE_INSEE_CLIENT_ID: backendEnv.SIRENE_INSEE_CLIENT_ID,
  SIRENE_INSEE_CLIENT_SECRET: backendEnv.SIRENE_INSEE_CLIENT_SECRET,
  SIRENE_INSEE_USERNAME: backendEnv.SIRENE_INSEE_USERNAME,
  SIRENE_INSEE_PASSWORD: backendEnv.SIRENE_INSEE_PASSWORD,
  DATABASE_URL:
    process.env.E2E_DATABASE_URL ??
    "postgresql://immersion:pg_password@localhost:5432/immersion-db",
  CORS_ALLOWED_ORIGINS: "http://localhost:3000",
};

export default defineConfig({
  testDir: "./tests",
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
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
      env: backWebServerEnv,
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
