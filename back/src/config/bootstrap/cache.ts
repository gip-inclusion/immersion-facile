import { createClient as createRedisClient } from "redis";
import { makeRedisWithCache } from "../../domains/core/caching-gateway/adapters/makeRedisWithCache";
import { withNoCache } from "../../domains/core/caching-gateway/adapters/withNoCache";
import type { WithCache } from "../../domains/core/caching-gateway/port/WithCache";
import { createLogger } from "../../utils/logger";
import type { AppConfig } from "./appConfig";

const logger = createLogger(__filename);

export const getWithCache = async (
  config: AppConfig,
): Promise<{ withCache: WithCache; disconnectCache: () => Promise<void> }> => {
  const defaultCacheDurationInHours = 24;
  if (config.cache === "NONE")
    return { withCache: withNoCache, disconnectCache: async () => {} };
  if (config.cache === "REDIS") {
    const redisClient = await makeConnectedRedisClient(config);
    return {
      withCache: makeRedisWithCache({
        defaultCacheDurationInHours,
        redisClient: redisClient,
      }),
      disconnectCache: () => redisClient.disconnect(),
    };
  }
  return config.cache satisfies never;
};

const makeConnectedRedisClient = async (config: AppConfig) => {
  const redisClient = await createRedisClient({
    url: config.redisUrl,
  }).connect();

  redisClient.on("disconnect", () => {
    logger.warn({
      message: "Redis disconnected - attempting to reconnect...",
    });
  });

  redisClient.on("reconnecting", () => {
    logger.info({ message: "Redis attempting to reconnect..." });
  });

  redisClient.on("connect", () => {
    logger.info({ message: "Redis connected successfully" });
  });

  redisClient.on("ready", () => {
    logger.info({ message: "Redis client ready for commands" });
  });

  redisClient.on("error", (err) =>
    logger.error({
      message: `Redis Client Error : ${err.message}`,
      error: err,
    }),
  );

  logger.info({ message: "Redis client connected successfully" });

  return redisClient;
};
