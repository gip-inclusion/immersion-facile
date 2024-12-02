import { expectToEqual } from "shared";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import { makeInMemoryWithCache } from "./makeInMemoryWithCache";

type GetStuffParams = { bidule: string };

describe("makeInMemoryWithCache", () => {
  let timeGateway: CustomTimeGateway;

  const getStuff = async (params: GetStuffParams) => {
    calls.push(params);
    return [
      {
        name: "Bidule",
        address: `123 ${params.bidule}`,
      },
    ];
  };
  const calls: GetStuffParams[] = [];

  let cachedGetStuff: typeof getStuff;

  beforeEach(() => {
    calls.length = 0; // reset calls
    timeGateway = new CustomTimeGateway();
    const withCache = makeInMemoryWithCache({
      defaultCacheDurationInHours: 1,
      timeGateway,
    });

    cachedGetStuff = withCache({
      getCacheKey: (params) => params.bidule,
      cb: getStuff,
    });
  });

  it("gets the data from the function, if it is called for the first time, than gets it from the cache, than from the function when expired", async () => {
    const query = { bidule: "yo" };
    timeGateway.setNextDate(new Date("2024-12-01T12:00:00.000Z"));
    const result = await cachedGetStuff(query);
    const expectedResult = [
      {
        name: "Bidule",
        address: "123 yo",
      },
    ];
    expectToEqual(result, expectedResult);
    expect(calls).toHaveLength(1);

    timeGateway.setNextDate(new Date("2024-12-01T12:59:00.000Z"));
    expectToEqual(await cachedGetStuff(query), expectedResult);
    expect(calls).toHaveLength(1);

    timeGateway.setNextDate(new Date("2024-12-01T13:01:00.000Z"));
    expectToEqual(await cachedGetStuff(query), expectedResult);
    expect(calls).toHaveLength(2);
  });
});
