import { resolve } from "node:path";
import { adminPlaywrightEmail, makeThrowIfNotDefinedOrDefault } from "shared";
import { loadEnvFileWithProcessEnv } from "./e2e-env";

const throwIfNotDefinedOrDefault = makeThrowIfNotDefinedOrDefault(
  loadEnvFileWithProcessEnv(resolve(__dirname, ".env")),
);

export const testConfig = {
  timeForDebounce: 600, // debounce time value * 2 for safety
  timeForEventCrawler: 2000, // event crawler time interval + 1s for safety
  proConnect: {
    baseUrl: "https://fca.integ01.dev-agentconnect.fr/api/v2",
    username: throwIfNotDefinedOrDefault("PC_USERNAME"),
    password: throwIfNotDefinedOrDefault("PC_PASSWORD"),
    adminUsername: adminPlaywrightEmail,
    adminPassword: throwIfNotDefinedOrDefault("PC_ADMIN_PASSWORD"),
  },
  adminAuthFile: ".auth/admin.json",
  establishmentAuthFile: ".auth/establishment.json",
  agencyAuthFile: ".auth/agency.json",
};
