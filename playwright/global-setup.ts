import { execSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { FullConfig } from "@playwright/test";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import dotEnv from "dotenv";

const CONTAINER_STATE_FILE = resolve(__dirname, ".container-state.json");

const cleanupPreviousContainer = () => {
  if (!existsSync(CONTAINER_STATE_FILE)) return;

  try {
    const state = JSON.parse(readFileSync(CONTAINER_STATE_FILE, "utf-8"));
    console.log(`Cleaning up previous container ${state.containerId}...`);
    execSync(`docker rm -f ${state.containerId}`, { stdio: "ignore" });
  } catch {
    // Ignore errors - container might already be gone
  }
  try {
    unlinkSync(CONTAINER_STATE_FILE);
  } catch {
    // Ignore
  }
};

export default async function globalSetup(_config: FullConfig) {
  // Disable testcontainers reuse and Ryuk (cleanup daemon)
  process.env.TESTCONTAINERS_REUSE_ENABLE = "false";
  process.env.TESTCONTAINERS_RYUK_DISABLED = "true";

  dotEnv.config({
    path: "./.env",
    override: true,
  });

  // Clean up any stale container from previous runs
  cleanupPreviousContainer();

  console.log("Starting PostgreSQL testcontainer for E2E tests...");

  // Use 13-master which has ARM64 support for M1/M2 Macs
  const container = await new PostgreSqlContainer("postgis/postgis:13-master")
    .withDatabase("immersion-db")
    .withUsername("immersion")
    .withPassword("password")
    .withStartupTimeout(120000)
    .start();

  const connectionUri = container.getConnectionUri();
  console.log(`PostgreSQL container started: ${connectionUri}`);

  console.log("Running migrations (using bun)...");
  execSync("pnpm db:up:bun", {
    cwd: resolve(__dirname, ".."),
    env: {
      ...process.env,
      DATABASE_URL: connectionUri,
    },
    stdio: "inherit",
  });
  console.log("Migrations completed");

  writeFileSync(
    CONTAINER_STATE_FILE,
    JSON.stringify({
      containerId: container.getId(),
      connectionUri,
      host: container.getHost(),
      port: container.getPort(),
    }),
  );

  process.env.DATABASE_URL = connectionUri;
}

export { CONTAINER_STATE_FILE };
