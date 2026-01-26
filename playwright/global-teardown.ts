import { readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import type { FullConfig } from "@playwright/test";

const CONTAINER_STATE_FILE = resolve(__dirname, ".container-state.json");

export default async function globalTeardown(_config: FullConfig) {
  try {
    const state = JSON.parse(readFileSync(CONTAINER_STATE_FILE, "utf-8"));
    console.log(`Stopping PostgreSQL container ${state.containerId}...`);

    const { execSync } = await import("node:child_process");
    execSync(`docker stop ${state.containerId}`, { stdio: "inherit" });
    execSync(`docker rm ${state.containerId}`, { stdio: "inherit" });

    unlinkSync(CONTAINER_STATE_FILE);
    console.log("PostgreSQL container stopped and removed");
  } catch (error) {
    console.warn("Could not clean up container:", error);
  }
}
