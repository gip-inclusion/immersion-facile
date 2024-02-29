import { Pool } from "pg";
import { AppConfig } from "../bootstrap/appConfig";

export const optional = <T>(v: T | null) => v ?? undefined;

export const getTestPgPool = () => {
  const appConfig = AppConfig.createFromEnv();
  return new Pool({ connectionString: appConfig.pgImmersionDbUrl });
};
