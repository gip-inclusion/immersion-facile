import { RedisClientType } from "redis";
import { DefaultCacheConfig, MakeWithCache } from "../port/WithCache";

type RedisWithCacheConfig = DefaultCacheConfig & {
  redisClient: RedisClientType;
};

export const makeRedisWithCache: MakeWithCache<RedisWithCacheConfig> =
  ({ defaultCacheDurationInHours, redisClient }) =>
  ({ overrideCacheDurationInHours, getCacheKey, cb }) => {
    type Callback = typeof cb;
    return (async (...params: Parameters<Callback>) => {
      const cacheKey = getCacheKey(...params);

      const cachedValue = await redisClient.get(cacheKey);
      if (cachedValue) {
        try {
          return JSON.parse(cachedValue);
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
