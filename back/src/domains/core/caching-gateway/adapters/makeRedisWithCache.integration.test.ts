import { RedisClientType } from "redis";
import { expectPromiseToFailWithError, expectToEqual } from "shared";
import { getTestRedisClient, makeRedisWithCache } from "./makeRedisWithCache";

describe("createRedisWithCache implementation", () => {
  const calls: string[] = [];
  const someCallToAPartner = async (query: string) => {
    calls.push(query);
    if (query === "throw") throw new Error("Throwing as requested");
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

  it("calls the function the first time than gets results from cache", async () => {
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
      new Error("Throwing as requested"),
    );
    expect(calls).toEqual([query]);

    await expectPromiseToFailWithError(
      cachedCallToPartner(query),
      new Error("Throwing as requested"),
    );
    expect(calls).toEqual([query, query]);
  });
});
