import minutesToSeconds from "date-fns/minutesToSeconds";
import type { AccessTokenResponse } from "../../../../config/bootstrap/appConfig";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import { InMemoryCachingGateway } from "./InMemoryCachingGateway";

const testResponse1: AccessTokenResponse = {
  access_token: "token1",
  expires_in: minutesToSeconds(10),
  scope: "scope1",
  token_type: "Bearer",
};
const testResponse2: AccessTokenResponse = {
  access_token: "token2",
  expires_in: minutesToSeconds(10),
  scope: "scope2",
  token_type: "Bearer",
};

describe("InMemoryCachingGateway with GetAccessTokenResponse", () => {
  let mockGetAccessTokenFn: jest.Mock;
  let timeGateway: CustomTimeGateway;
  let cachedAccessTokenGateway: InMemoryCachingGateway<AccessTokenResponse>;

  beforeEach(() => {
    mockGetAccessTokenFn = jest.fn();
    timeGateway = new CustomTimeGateway(new Date("2021-01-01T00:00:00Z"));
    cachedAccessTokenGateway = new InMemoryCachingGateway<AccessTokenResponse>(
      timeGateway,
      "expires_in",
    );
  });

  it("fetches a new token if none is cached", async () => {
    mockGetAccessTokenFn.mockReturnValueOnce(testResponse1);

    const response = await cachedAccessTokenGateway.caching("scope", () =>
      mockGetAccessTokenFn("scope"),
    );
    expect(mockGetAccessTokenFn.mock.calls).toHaveLength(1);
    expect(mockGetAccessTokenFn.mock.calls[0][0]).toBe("scope");
    expect(response).toEqual(testResponse1);
  });

  it("returns the cached token while it's not expired", async () => {
    mockGetAccessTokenFn.mockReturnValueOnce(testResponse1);

    // Initial call caches the token.
    timeGateway.setNextDateStr("2021-01-01T00:00:00Z");
    const response1 = await cachedAccessTokenGateway.caching("scope", () =>
      mockGetAccessTokenFn("scope"),
    );
    expect(mockGetAccessTokenFn.mock.calls).toHaveLength(1);
    expect(response1).toEqual(testResponse1);

    // Subsequent call returns the cached token.
    timeGateway.setNextDateStr("2021-01-01T00:09:00Z");
    const response2 = await cachedAccessTokenGateway.caching("scope", () =>
      mockGetAccessTokenFn("scope"),
    );
    expect(mockGetAccessTokenFn.mock.calls).toHaveLength(1);
    expect(response2).toEqual(testResponse1);
  });

  it("refreshes the cached token when it's expired", async () => {
    mockGetAccessTokenFn
      .mockReturnValueOnce(testResponse1)
      .mockReturnValueOnce(testResponse2);

    // Initial call caches a token.
    timeGateway.setNextDateStr("2021-01-01T00:00:00Z");
    const response1 = await cachedAccessTokenGateway.caching("scope", () =>
      mockGetAccessTokenFn("scope"),
    );
    expect(mockGetAccessTokenFn.mock.calls).toHaveLength(1);
    expect(response1).toEqual(testResponse1);

    // The TTL of the cached token is exceeded so a new one is fetched.
    timeGateway.setNextDates([
      new Date("2021-01-01T00:10:00Z"),
      new Date("2021-01-01T00:10:00Z"),
    ]);
    const response2 = await cachedAccessTokenGateway.caching("scope", () =>
      mockGetAccessTokenFn("scope"),
    );
    expect(mockGetAccessTokenFn.mock.calls).toHaveLength(2);
    expect(response2).toEqual(testResponse2);

    // Subsequent calls return the refreshed token.
    timeGateway.setNextDateStr("2021-01-01T00:19:00Z");
    const response3 = await cachedAccessTokenGateway.caching("scope", () =>
      mockGetAccessTokenFn("scope"),
    );
    expect(mockGetAccessTokenFn.mock.calls).toHaveLength(2);
    expect(response3).toEqual(testResponse2);
  });

  it("tokens with less than 30 sec until expiry are considered expired", async () => {
    mockGetAccessTokenFn
      .mockReturnValueOnce(testResponse1)
      .mockReturnValueOnce(testResponse2);

    // Initial call caches the token.
    timeGateway.setNextDateStr("2021-01-01T00:00:00Z");
    const response1 = await cachedAccessTokenGateway.caching("scope", () =>
      mockGetAccessTokenFn("scope"),
    );
    expect(mockGetAccessTokenFn.mock.calls).toHaveLength(1);
    expect(response1).toEqual(testResponse1);

    // Not expired yet.
    timeGateway.setNextDateStr("2021-01-01T00:09:30Z");
    const response2 = await cachedAccessTokenGateway.caching("scope", () =>
      mockGetAccessTokenFn("scope"),
    );
    expect(response2).toEqual(testResponse1);

    // Now it's expired.
    timeGateway.setNextDateStr("2021-01-01T00:09:31Z");
    const response3 = await cachedAccessTokenGateway.caching("scope", () =>
      mockGetAccessTokenFn("scope"),
    );
    expect(response3).toEqual(testResponse2);
  });

  it("multiple requests wait the same token while it is being refreshed", async () => {
    mockGetAccessTokenFn.mockReturnValue(testResponse1);

    const responses = await Promise.all([
      cachedAccessTokenGateway.caching("scope", () =>
        mockGetAccessTokenFn("scope"),
      ),
      cachedAccessTokenGateway.caching("scope", () =>
        mockGetAccessTokenFn("scope"),
      ),
      cachedAccessTokenGateway.caching("scope", () =>
        mockGetAccessTokenFn("scope"),
      ),
    ]);

    expect(mockGetAccessTokenFn.mock.calls).toHaveLength(1);
    expect(responses[1]).toEqual(responses[0]);
    expect(responses[2]).toEqual(responses[0]);
  });
});
