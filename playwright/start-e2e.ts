import { execSync, spawn } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import dotEnv from "dotenv";
import { e2eBackendEnv } from "./e2e-backend-env";

dotEnv.config({ path: resolve(__dirname, ".env"), override: true });

const CONTAINER_STATE_FILE = resolve(__dirname, ".container-state.json");
const ROOT_DIR = resolve(__dirname, "..");

const customFlags = ["--dev", "--reset", "--stop"] as const;

type ContainerState = {
  containerId: string;
  connectionUri: string;
  host: string;
  port: number;
};

const parseArgs = () => {
  const allArgs = process.argv.slice(2);
  const flags = {
    dev: allArgs.includes("--dev"),
    reset: allArgs.includes("--reset"),
    stop: allArgs.includes("--stop"),
  };
  const playwrightArgs = allArgs.filter(
    (arg) => !customFlags.includes(arg as (typeof customFlags)[number]),
  );
  return { flags, playwrightArgs };
};

const readContainerState = (): ContainerState | undefined => {
  if (!existsSync(CONTAINER_STATE_FILE)) return undefined;
  try {
    return JSON.parse(readFileSync(CONTAINER_STATE_FILE, "utf-8"));
  } catch {
    return undefined;
  }
};

const isContainerRunning = (containerId: string): boolean => {
  try {
    const result = execSync(
      `docker inspect --format='{{.State.Running}}' ${containerId}`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    ).trim();
    return result === "true" || result === "'true'";
  } catch {
    return false;
  }
};

const stopAndCleanup = (state: ContainerState | undefined) => {
  if (!state) {
    console.log("No container state found, nothing to stop.");
    return;
  }
  try {
    console.log(`Stopping container ${state.containerId}...`);
    execSync(`docker rm -f ${state.containerId}`, { stdio: "ignore" });
    console.log("Container stopped.");
  } catch {
    console.log("Container already gone.");
  }
  try {
    rmSync(CONTAINER_STATE_FILE);
  } catch {
    // ignore
  }
};

const startFreshContainer = async (): Promise<{
  connectionUri: string;
  containerId: string;
}> => {
  console.log("Starting PostgreSQL testcontainer for E2E tests...");
  console.time("container-start");

  const container = await new PostgreSqlContainer("postgis/postgis:13-master")
    .withDatabase("immersion-db")
    .withUsername("immersion")
    .withPassword("password")
    .withStartupTimeout(120000)
    .start();

  const connectionUri = container.getConnectionUri();
  const containerId = container.getId();
  console.timeEnd("container-start");
  console.log(`PostgreSQL container started: ${connectionUri}`);

  writeFileSync(
    CONTAINER_STATE_FILE,
    JSON.stringify({
      containerId,
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
  execSync("pnpm db:up:bun", { cwd: ROOT_DIR, env: execEnv, stdio: "inherit" });
  console.timeEnd("migrations");

  console.log("Running seed...");
  console.time("seed");
  execSync("pnpm db:seed:bun", {
    cwd: ROOT_DIR,
    env: execEnv,
    stdio: "inherit",
  });
  console.timeEnd("seed");

  return { connectionUri, containerId };
};

const runPlaywright = (
  connectionUri: string,
  args: string[],
  onClose: (code: number) => void,
) => {
  console.log("Starting Playwright tests...");
  const playwright = spawn("pnpm", ["exec", "playwright", "test", ...args], {
    stdio: "inherit",
    cwd: __dirname,
    env: { ...process.env, E2E_DATABASE_URL: connectionUri },
  });
  playwright.on("close", (code) => onClose(code ?? 0));
};

const main = async () => {
  process.env.TESTCONTAINERS_REUSE_ENABLE = "false";
  process.env.TESTCONTAINERS_RYUK_DISABLED = "true";

  const { flags, playwrightArgs } = parseArgs();

  // --stop mode: stop cached container and exit
  if (flags.stop) {
    stopAndCleanup(readContainerState());
    return;
  }

  // --dev mode: reuse container if possible
  if (flags.dev) {
    const existingState = readContainerState();
    const canReuse =
      !flags.reset &&
      existingState !== undefined &&
      isContainerRunning(existingState.containerId);

    const connectionUri = canReuse
      ? (() => {
          console.log(
            `Reusing existing container ${existingState.containerId}`,
          );
          console.log("Re-seeding database...");
          console.time("seed");
          execSync("pnpm db:seed:bun", {
            cwd: ROOT_DIR,
            env: {
              ...process.env,
              ...e2eBackendEnv,
              DATABASE_URL: existingState.connectionUri,
            },
            stdio: "inherit",
          });
          console.timeEnd("seed");
          return existingState.connectionUri;
        })()
      : await (async () => {
          if (existingState) stopAndCleanup(existingState);
          const fresh = await startFreshContainer();
          return fresh.connectionUri;
        })();

    runPlaywright(connectionUri, playwrightArgs, (code) => {
      // dev mode: don't stop container on exit
      process.exit(code);
    });

    process.on("SIGINT", () => {
      console.log("\nReceived SIGINT (dev mode: container kept alive)");
      process.exit(1);
    });
    process.on("SIGTERM", () => {
      console.log("\nReceived SIGTERM (dev mode: container kept alive)");
      process.exit(1);
    });
    return;
  }

  // CI mode (no flags): fresh container, cleanup on exit
  stopAndCleanup(readContainerState());
  const { connectionUri, containerId } = await startFreshContainer();

  const cleanup = () => {
    console.log("Stopping PostgreSQL container...");
    try {
      execSync(`docker rm -f ${containerId}`, { stdio: "ignore" });
    } catch {
      // already gone
    }
    if (existsSync(CONTAINER_STATE_FILE)) rmSync(CONTAINER_STATE_FILE);
    console.log("Container stopped.");
  };

  runPlaywright(connectionUri, playwrightArgs, (code) => {
    cleanup();
    process.exit(code);
  });

  process.on("SIGINT", () => {
    console.log("\nReceived SIGINT, cleaning up...");
    cleanup();
    process.exit(1);
  });

  process.on("SIGTERM", () => {
    console.log("\nReceived SIGTERM, cleaning up...");
    cleanup();
    process.exit(1);
  });
};

main().catch((err) => {
  console.error("E2E setup failed:", err);
  process.exit(1);
});
