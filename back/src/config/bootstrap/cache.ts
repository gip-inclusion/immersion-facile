import { createClient as createRedisClient } from "redis";
import { withNoCache } from "../../domains/core/caching-gateway/adapters/makeNotCachedWithCache";
import { makeRedisWithCache } from "../../domains/core/caching-gateway/adapters/makeRedisWithCache";
import { WithCache } from "../../domains/core/caching-gateway/port/WithCache";
import { createLogger } from "../../utils/logger";
import { type AppConfig } from "./appConfig";

const logger = createLogger(__filename);

export const getWithCache = async (config: AppConfig): Promise<WithCache> => {
  const defaultCacheDurationInHours = 24;
  if (config.cache === "NONE") return withNoCache;
  if (config.cache === "REDIS") {
    return makeRedisWithCache({
      defaultCacheDurationInHours,
      redisClient: await makeConnectedRedisClient(config),
    });
  }
  return config.cache satisfies never;
};

const makeConnectedRedisClient = async (config: AppConfig) => {
  const redisClient = await createRedisClient({
    url: config.redisUrl,
  }).connect();

  // Handle disconnections
  redisClient.on("disconnect", () => {
    logger.warn({
      message: "Redis disconnected - attempting to reconnect...",
    });
  });

  // Handle reconnection attempts
  redisClient.on("reconnecting", () => {
    logger.info({ message: "Redis attempting to reconnect..." });
  });

  // Handle successful reconnection
  redisClient.on("connect", () => {
    logger.info({ message: "Redis connected successfully" });
  });

  // Handle when ready for commands
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
