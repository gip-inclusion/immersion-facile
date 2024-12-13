import { expectToEqual } from "shared";
import { getTestRedisClient, makeRedisWithCache } from "./makeRedisWithCache";

describe("createRedisWithCache implementation", () => {
  const calls: string[] = [];
  const someCallToAPartner = async (query: string) => {
    calls.push(query);
    return {
      value: `value is : ${query}`,
    };
  };

  let cachedCallToPartner: typeof someCallToAPartner;

  beforeEach(async () => {
    const redisClient = await getTestRedisClient();
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
});
