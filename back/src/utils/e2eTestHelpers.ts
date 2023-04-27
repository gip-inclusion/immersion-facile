import supertest from "supertest";
import { shortLinkRoute } from "shared";

export const shortLinkRedirectToLinkWithValidation = async (
  shortLink: string,
  request: supertest.SuperTest<supertest.Test>,
): Promise<string> => {
  const shortLinkResult = await request
    .get(makeShortLinkForE2e(shortLink))
    .send();
  expect(shortLinkResult.status).toBe(302);
  expect(typeof shortLinkResult.headers.location === "string").toBeTruthy();
  return shortLinkResult.headers.location as string;
};

const makeShortLinkForE2e = (shortLinkInEmail: string): string =>
  `/${shortLinkRoute}${shortLinkInEmail.split(shortLinkRoute)[1]}`;
