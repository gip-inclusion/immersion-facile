import { TechnicalRoutes, expectHttpResponseToEqual } from "shared";
import { HttpClient } from "shared-routes";

export const shortLinkRedirectToLinkWithValidation = async (
  shortLink: string,
  httpClient: HttpClient<TechnicalRoutes>,
): Promise<string> => {
  const shortLinkResult = await httpClient.shortLink({
    urlParams: { shortLinkId: makeShortLinkForE2e(shortLink) },
  });

  expectHttpResponseToEqual(shortLinkResult, {
    body: {},
    status: 302,
  });

  expect(typeof shortLinkResult.headers.location === "string").toBeTruthy();
  return shortLinkResult.headers.location as string;
};

const makeShortLinkForE2e = (shortLinkInEmail: string): string =>
  `${shortLinkInEmail.split("to/")[1]}`;
