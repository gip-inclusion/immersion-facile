import { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { DefaultCacheConfig, MakeWithCache } from "../port/WithCache";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

type InMemoryWithCacheConfig = DefaultCacheConfig & {
  timeGateway: TimeGateway;
};

export const makeInMemoryWithCache: MakeWithCache<InMemoryWithCacheConfig> =
  ({ defaultCacheDurationInHours, timeGateway }) =>
  ({
    overrideCacheDurationInHours,

    getCacheKey,
    cb,
  }) => {
    type Callback = typeof cb;
    const cache = new Map<string, CacheEntry<Awaited<ReturnType<Callback>>>>();
    const isExpired = (timestamp: number) =>
      timeGateway.now().getTime() - timestamp >
      (overrideCacheDurationInHours ?? defaultCacheDurationInHours) *
        60 *
        60 *
        1000;

    return (async (...params: Parameters<Callback>) => {
      const key = getCacheKey(...params);
      const entry = cache.get(key);

      if (entry && !isExpired(entry.timestamp)) {
        return entry.data;
      }

      const fresh = await cb(...params);
      cache.set(key, { data: fresh, timestamp: timeGateway.now().getTime() });

      return fresh;
    }) as Callback;
  };
