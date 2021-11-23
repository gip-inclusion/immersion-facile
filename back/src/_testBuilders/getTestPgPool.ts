import { Pool } from "pg";
import { AppConfig } from "../adapters/primary/appConfig";

export const getTestPgPool = () => {
  const appConfig = AppConfig.createFromEnv();
  return new Pool({ connectionString: appConfig.pgImmersionDbUrl });
};
