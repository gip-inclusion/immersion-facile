import { AppConfigBuilder } from "./AppConfigBuilder";

export const getTestPgPool = () => {
  const config = new AppConfigBuilder({
    REPOSITORIES: "PG",
    PG_URL: process.env.PG_URL,
  }).build();

  return config.pgPool;
};
