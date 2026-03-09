import { execSync, spawn } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import dotEnv from "dotenv";
import { e2eBackendEnv } from "./e2e-backend-env";

dotEnv.config({ path: resolve(__dirname, ".env"), override: true });

const CONTAINER_STATE_FILE = resolve(__dirname, ".container-state.json");
const ROOT_DIR = resolve(__dirname, "..");

const cleanupPreviousContainer = () => {
  if (!existsSync(CONTAINER_STATE_FILE)) return;

  try {
    const state = JSON.parse(
      require("node:fs").readFileSync(CONTAINER_STATE_FILE, "utf-8"),
    );
    console.log(`Cleaning up previous container ${state.containerId}...`);
    execSync(`docker rm -f ${state.containerId}`, { stdio: "ignore" });
  } catch {
    // container might already be gone
  }
  try {
    rmSync(CONTAINER_STATE_FILE);
  } catch {
    // ignore
  }
};

const main = async () => {
  process.env.TESTCONTAINERS_REUSE_ENABLE = "false";
  process.env.TESTCONTAINERS_RYUK_DISABLED = "true";

  cleanupPreviousContainer();

  console.log("Starting PostgreSQL testcontainer for E2E tests...");
  console.time("container-start");

  const container = await new PostgreSqlContainer("postgis/postgis:13-master")
    .withDatabase("immersion-db")
    .withUsername("immersion")
    .withPassword("password")
    .withStartupTimeout(120000)
    .start();

  const connectionUri = container.getConnectionUri();
  console.timeEnd("container-start");
  console.log(`PostgreSQL container started: ${connectionUri}`);

  writeFileSync(
    CONTAINER_STATE_FILE,
    JSON.stringify({
      containerId: container.getId(),
      connectionUri,
      host: container.getHost(),
      port: container.getPort(),
    }),
  );

  const execEnv = {
    ...process.env,
    ...e2eBackendEnv,
    DATABASE_URL: connectionUri,
  };

  console.log("Running migrations...");
  console.time("migrations");
  execSync("pnpm db:up:bun", {
    cwd: ROOT_DIR,
    env: execEnv,
    stdio: "inherit",
  });
  console.timeEnd("migrations");

  console.log("Running seed...");
  console.time("seed");
  execSync("pnpm db:seed:bun", {
    cwd: ROOT_DIR,
    env: execEnv,
    stdio: "inherit",
  });
  console.timeEnd("seed");

  console.log("Starting Playwright tests...");

  const args = process.argv.slice(2);
  const playwright = spawn("pnpm", ["exec", "playwright", "test", ...args], {
    stdio: "inherit",
    cwd: __dirname,
    env: {
      ...process.env,
      E2E_DATABASE_URL: connectionUri,
    },
  });

  const cleanup = async () => {
    console.log("Stopping PostgreSQL container...");
    await container.stop();
    if (existsSync(CONTAINER_STATE_FILE)) rmSync(CONTAINER_STATE_FILE);
    console.log("Container stopped");
  };

  playwright.on("close", async (code) => {
    await cleanup();
    process.exit(code ?? 0);
  });

  process.on("SIGINT", async () => {
    console.log("\nReceived SIGINT, cleaning up...");
    await cleanup();
    process.exit(1);
  });

  process.on("SIGTERM", async () => {
    console.log("\nReceived SIGTERM, cleaning up...");
    await cleanup();
    process.exit(1);
  });
};

main().catch((err) => {
  console.error("E2E setup failed:", err);
  process.exit(1);
});
