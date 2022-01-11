import minutesToSeconds from "date-fns/minutesToSeconds";
import { CachingAccessTokenGateway } from "../../adapters/secondary/core/CachingAccessTokenGateway";
import { CustomClock } from "../../adapters/secondary/core/ClockImplementations";
import { GetAccessTokenResponse } from "../../domain/core/ports/AccessTokenGateway";

const testResponse1: GetAccessTokenResponse = {
  access_token: "token1",
  expires_in: minutesToSeconds(10),
};
const testResponse2: GetAccessTokenResponse = {
  access_token: "token2",
  expires_in: minutesToSeconds(10),
};

describe("CachingAccessTokenGateway", () => {
  let mockGetAccessTokenFn: jest.Mock<any, any>;
  let fakeClock: CustomClock;
  let cachedAccessTokenGateway: CachingAccessTokenGateway;

  beforeEach(() => {
    mockGetAccessTokenFn = jest.fn();
    fakeClock = new CustomClock();
    cachedAccessTokenGateway = new CachingAccessTokenGateway(
      {
        getAccessToken: mockGetAccessTokenFn,
      },
      fakeClock,
    );
  });

  test("fetches a new token if none is cached", async () => {
    mockGetAccessTokenFn.mockReturnValueOnce(testResponse1);

    const response = await cachedAccessTokenGateway.getAccessToken("scope");
    expect(mockGetAccessTokenFn.mock.calls).toHaveLength(1);
    expect(mockGetAccessTokenFn.mock.calls[0][0]).toEqual("scope");
    expect(response).toEqual(testResponse1);
  });

  test("returns the cached token while it's not expired", async () => {
    mockGetAccessTokenFn.mockReturnValueOnce(testResponse1);

    // Initial call caches the token.
    fakeClock.setNextDateStr("2021-01-01T00:00:00Z");
    const response1 = await cachedAccessTokenGateway.getAccessToken("scope");
    expect(mockGetAccessTokenFn.mock.calls).toHaveLength(1);
    expect(response1).toEqual(testResponse1);

    // Subsequent call returns the cached token.
    fakeClock.setNextDateStr("2021-01-01T00:09:00Z");
    const response2 = await cachedAccessTokenGateway.getAccessToken("scope");
    expect(mockGetAccessTokenFn.mock.calls).toHaveLength(1);
    expect(response2).toEqual(testResponse1);
  });

  test("refreshes the cached token when it's expired", async () => {
    mockGetAccessTokenFn
      .mockReturnValueOnce(testResponse1)
      .mockReturnValueOnce(testResponse2);

    // Initial call caches a token.
    fakeClock.setNextDateStr("2021-01-01T00:00:00Z");
    const response1 = await cachedAccessTokenGateway.getAccessToken("scope");
    expect(mockGetAccessTokenFn.mock.calls).toHaveLength(1);
    expect(response1).toEqual(testResponse1);

    // The TTL of the cached token is exceeded so a new one is fetched.
    fakeClock.setNextDateStr("2021-01-01T00:10:00Z");
    const response2 = await cachedAccessTokenGateway.getAccessToken("scope");
    expect(mockGetAccessTokenFn.mock.calls).toHaveLength(2);
    expect(response2).toEqual(testResponse2);

    // Subsequent calls return the refreshed token.
    fakeClock.setNextDateStr("2021-01-01T00:19:00Z");
    const response3 = await cachedAccessTokenGateway.getAccessToken("scope");
    expect(mockGetAccessTokenFn.mock.calls).toHaveLength(2);
    expect(response3).toEqual(testResponse2);
  });

  test("tokens with less than 30 sec until expiry are considered expired", async () => {
    mockGetAccessTokenFn
      .mockReturnValueOnce(testResponse1)
      .mockReturnValueOnce(testResponse2);

    // Initial call caches the token.
    fakeClock.setNextDateStr("2021-01-01T00:00:00Z");
    const response1 = await cachedAccessTokenGateway.getAccessToken("scope");
    expect(mockGetAccessTokenFn.mock.calls).toHaveLength(1);
    expect(response1).toEqual(testResponse1);

    // Not expired yet.
    fakeClock.setNextDateStr("2021-01-01T00:09:30Z");
    const response2 = await cachedAccessTokenGateway.getAccessToken("scope");
    expect(response2).toEqual(testResponse1);

    // Now it's expired.
    fakeClock.setNextDateStr("2021-01-01T00:09:31Z");
    const response3 = await cachedAccessTokenGateway.getAccessToken("scope");
    expect(response3).toEqual(testResponse2);
  });

  test("multiple requests wait the same token while it is being refreshed", async () => {
    mockGetAccessTokenFn.mockReturnValue(testResponse1);

    const responses = await Promise.all([
      cachedAccessTokenGateway.getAccessToken("scope"),
      cachedAccessTokenGateway.getAccessToken("scope"),
      cachedAccessTokenGateway.getAccessToken("scope"),
    ]);

    expect(mockGetAccessTokenFn.mock.calls).toHaveLength(1);
    expect(responses[1]).toEqual(responses[0]);
    expect(responses[2]).toEqual(responses[0]);
  });
});
