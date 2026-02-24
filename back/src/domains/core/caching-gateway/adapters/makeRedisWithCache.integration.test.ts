import type { RedisClientType } from "redis";
import { errors, expectPromiseToFailWithError, expectToEqual } from "shared";
import { getTestRedisClient, makeRedisWithCache } from "./makeRedisWithCache";

describe("createRedisWithCache implementation", () => {
  const calls: string[] = [];
  const someCallToAPartner = async (query: string) => {
    calls.push(query);
    if (query === "throw")
      throw errors.generic.testError("Throwing as requested");
    return {
      value: `value is : ${query}`,
    };
  };

  let cachedCallToPartner: typeof someCallToAPartner;
  let redisClient: RedisClientType<any, any, any>;

  beforeAll(async () => {
    redisClient = await getTestRedisClient();
  });

  afterAll(async () => {
    await redisClient.disconnect();
  });

  beforeEach(async () => {
    await redisClient.flushAll();
    const withCache = makeRedisWithCache({
      defaultCacheDurationInHours: 1,
      redisClient,
    });
    calls.length = 0;
    cachedCallToPartner = withCache({
      cb: someCallToAPartner,
      getCacheKey: (query) => query,
    });
  });

  it("calls the function the first time then gets results from cache", async () => {
    const query = "my query";
    const expectedResult = { value: `value is : ${query}` };

    const result = await cachedCallToPartner(query);
    expect(calls).toEqual([query]);
    expectToEqual(result, expectedResult);

    const result2 = await cachedCallToPartner(query);
    expect(calls).toEqual([query]);
    expectToEqual(result2, expectedResult);
  });

  it("does not store errors when api call fails", async () => {
    const query = "throw";

    await expectPromiseToFailWithError(
      cachedCallToPartner(query),
      errors.generic.testError("Throwing as requested"),
    );
    expect(calls).toEqual([query]);

    await expectPromiseToFailWithError(
      cachedCallToPartner(query),
      errors.generic.testError("Throwing as requested"),
    );
    expect(calls).toEqual([query, query]);
  });

  describe("fallback to api call if redis client is not available", () => {
    const fakeThrowingRedisClient = {
      isOpen: true,
      get: async () => {
        throw new Error("Redis connection lost");
      },
      setEx: async () => {
        throw new Error("Redis connection lost");
      },
    } as unknown as RedisClientType<any, any, any>;

    it("bypasses cache and calls partner when redis is disconnected", async () => {
      const query = "query when disconnected";
      const expectedResult = { value: `value is : ${query}` };

      await redisClient.disconnect();

      const result = await cachedCallToPartner(query);
      expect(calls).toEqual([query]);
      expectToEqual(result, expectedResult);

      await redisClient.connect();
    });

    it("bypasses cache and calls partner when redis get throws", async () => {
      const query = "query when get throws";
      const expectedResult = { value: `value is : ${query}` };

      const withCache = makeRedisWithCache({
        defaultCacheDurationInHours: 1,
        redisClient: fakeThrowingRedisClient,
      });

      const cachedCall = withCache({
        cb: someCallToAPartner,
        getCacheKey: (q) => q,
      });

      const result = await cachedCall(query);
      expect(calls).toEqual([query]);
      expectToEqual(result, expectedResult);
    });

    it("returns result even when redis setEx throws after a cache miss", async () => {
      const query = "query when setEx throws";
      const expectedResult = { value: `value is : ${query}` };

      const withCache = makeRedisWithCache({
        defaultCacheDurationInHours: 1,
        redisClient: fakeThrowingRedisClient,
      });

      const cachedCall = withCache({
        cb: someCallToAPartner,
        getCacheKey: (q) => q,
      });

      const result = await cachedCall(query);
      expect(calls).toEqual([query]);
      expectToEqual(result, expectedResult);
    });
  });
});
