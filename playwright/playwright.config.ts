import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */

const frontPort = 3000;
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

export default defineConfig({
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
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
  webServer: {
    command: "./start-servers.sh",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      PORT: frontPort.toString(),
      NODE_ENV: "local",
      NOTIFICATION_GATEWAY: "IN_MEMORY",
      ESTABLISHMENT_MARKETING_GATEWAY: "IN_MEMORY",
      ADDRESS_API_GATEWAY: "OPEN_CAGE_DATA",
      PC_USERNAME: secrets.PC_USERNAME,
      PC_PASSWORD: secrets.PC_PASSWORD,
      PC_ADMIN_PASSWORD: secrets.PC_ADMIN_PASSWORD,
      PRO_CONNECT_GATEWAY: "HTTPS",
      PRO_CONNECT_CLIENT_ID: "449e24c6-b5aa-4435-bb8c-728d4a3c1c94",
      PRO_CONNECT_CLIENT_SECRET: secrets.PRO_CONNECT_CLIENT_SECRET,
      PRO_CONNECT_BASE_URI: "https://fca.integ01.dev-agentconnect.fr/api/v2",
      API_KEY_OPEN_CAGE_DATA_GEOCODING:
        secrets.API_KEY_OPEN_CAGE_DATA_GEOCODING,
      API_KEY_OPEN_CAGE_DATA_GEOSEARCH:
        secrets.API_KEY_OPEN_CAGE_DATA_GEOSEARCH,
      POLE_EMPLOI_GATEWAY: "IN_MEMORY",
      LA_BONNE_BOITE_GATEWAY: "IN_MEMORY",
      PASS_EMPLOI_GATEWAY: "IN_MEMORY",
      PDF_GENERATOR_GATEWAY: "IN_MEMORY",
      SHORT_LINK_ID_GENERATOR_GATEWAY: "NANO_ID",
      // Local-only test keys (compromised, never use in production)
      JWT_PRIVATE_KEY:
        "-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgevZzL1gdAFr88hb2\nOF/2NxApJCzGCEDdfSp6VQO30hyhRANCAAQRWz+jn65BtOMvdyHKcvjBeBSDZH2r\n1RTwjmYSi9R/zpBnuQ4EiMnCqfMPWiZqB4QdbAd0E7oH50VpuZ1P087G\n-----END PRIVATE KEY-----",
      JWT_PUBLIC_KEY:
        "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEEVs/o5+uQbTjL3chynL4wXgUg2R9\nq9UU8I5mEovUf86QZ7kOBIjJwqnzD1omageEHWwHdBO6B+dFabmdT9POxg==\n-----END PUBLIC KEY-----\n",
      API_JWT_PRIVATE_KEY:
        "-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIPnK7kOKC6VqJwmsXCcCgNfVEAMyt0IFm68g/dwg3/iVoAoGCCqGSM49\nAwEHoUQDQgAEXNo97BD4w2huuAYsmINnn/+TPolxYUexkcD49YyxsjJPA2d91B2r\nDzteUKnEsloNYDTeYW88oLPMdgmbzm+sQg==\n-----END EC PRIVATE KEY-----",
      API_JWT_PUBLIC_KEY:
        "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEXNo97BD4w2huuAYsmINnn/+TPolx\nYUexkcD49YyxsjJPA2d91B2rDzteUKnEsloNYDTeYW88oLPMdgmbzm+sQg==\n-----END PUBLIC KEY-----",
      DOMAIN: `localhost:${backPort}`,
      REPOSITORIES: "PG",
      INBOUND_EMAIL_ALLOWED_IPS: "::ffff:127.0.0.1",
      SIRENE_REPOSITORY: "ANNUAIRE_DES_ENTREPRISES",
      SIRENE_INSEE_ENDPOINT: "https://api.insee.fr/api-sirene/prive/3.11",
      SIRENE_INSEE_CLIENT_ID: secrets.SIRENE_INSEE_CLIENT_ID,
      SIRENE_INSEE_CLIENT_SECRET: secrets.SIRENE_INSEE_CLIENT_SECRET,
      SIRENE_INSEE_USERNAME: secrets.SIRENE_INSEE_USERNAME,
      SIRENE_INSEE_PASSWORD: secrets.SIRENE_INSEE_PASSWORD,
      EVENT_CRAWLER_PERIOD_MS: "600",
      EXTERNAL_AXIOS_TIMEOUT: "30000",
    },
  },
});
