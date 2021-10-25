import { AppConfig } from "../adapters/primary/appConfig";
import { AppConfigBuilder } from "./AppConfigBuilder";

export const getTestPgPool = () => {
  const appConfig = AppConfig.createFromEnv();

  const config = new AppConfigBuilder()
    .withRepositories("PG")
    .withPgUrl(appConfig.pgImmersionDbUrl)
    .build();

  return config.pgPool;
};
