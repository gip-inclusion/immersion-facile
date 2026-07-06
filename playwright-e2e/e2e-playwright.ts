import { spawn } from "node:child_process";

export const runPlaywright = (
  connectionUri: string,
  args: string[],
  onClose: (code: number) => void,
) => {
  console.log("Starting Playwright tests...");
  const playwright = spawn("pnpm", ["exec", "playwright", "test", ...args], {
    stdio: "inherit",
    cwd: __dirname,
    env: {
      ...process.env,
      E2E_DATABASE_URL: connectionUri,
      PLAYWRIGHT_REUSE_EXISTING_SERVER: "false",
    },
  });
  playwright.on("close", (code) => onClose(code ?? 0));
};
