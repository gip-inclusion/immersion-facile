import { type FullConfig } from "@playwright/test";
import dotEnv from "dotenv";

export default async function (_config: FullConfig) {
  dotEnv.config({
    path: "./.env",
    override: true,
  });
}
