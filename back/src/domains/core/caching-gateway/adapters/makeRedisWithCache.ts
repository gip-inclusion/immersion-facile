import type { RedisClientType } from "redis";
import { partnerNames } from "../../../../config/bootstrap/partnerNames";
import { createLogger } from "../../../../utils/logger";
import { DefaultCacheConfig, MakeWithCache } from "../port/WithCache";

const logger = createLogger(__filename);

type RedisWithCacheConfig = DefaultCacheConfig & {
  redisClient: RedisClientType<any, any, any>;
};

export const makeRedisWithCache: MakeWithCache<RedisWithCacheConfig> =
  ({ defaultCacheDurationInHours, redisClient }) =>
  ({ overrideCacheDurationInHours, getCacheKey, cb, logParams }) => {
    type Callback = typeof cb;
    return (async (...params: Parameters<Callback>) => {
      const start = Date.now();
      if (!redisClient.isOpen) return cb(...params);
      const cacheKey = getCacheKey(...params);

      const cachedValue = await redisClient.get(cacheKey);
      if (cachedValue) {
        try {
          const response = JSON.parse(cachedValue);
          if (logParams) {
            logger.info({
              partnerApiCall: {
                durationInMs: Date.now() - start,
                partnerName: partnerNames[logParams.partner],
                response: { kind: "cache-hit" },
                route: {
                  url: logParams.route.url,
                  method: logParams.route.method,
                },
              },
              cacheKey,
            });
          }
          return response;
        } catch (error) {
          console.error("Error parsing cached value:", error);
          // If parsing fails, continue to fetch fresh data
        }
      }

      const durationInSecond =
        (overrideCacheDurationInHours ?? defaultCacheDurationInHours) * 3600;

      const result = await cb(...params);

      try {
        await redisClient.setEx(
          cacheKey,
          durationInSecond,
          JSON.stringify(result),
        );
      } catch (error) {
        console.error("Error setting cache:", error);
        // Continue even if caching fails
      }

      return result;
    }) as Callback;
  };
