import { SuperTest, Test } from "supertest";
import { AbsoluteUrl, expectObjectsToMatch, shortLinkRoute } from "shared";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import {
  ShortLinkId,
  shortLinkNotFoundMessage,
} from "../../../../domain/core/ports/ShortLinkQuery";
import { InMemoryShortLinkQuery } from "../../../secondary/InMemoryShortLinkQuery";

describe("shortLink routes", () => {
  let shortLinkQuery: InMemoryShortLinkQuery;
  let request: SuperTest<Test>;

  beforeEach(async () => {
    const testAppAndDeps = await buildTestApp();
    shortLinkQuery = testAppAndDeps.inMemoryUow.shortLinkQuery;
    request = testAppAndDeps.request;
  });

  describe(`GET /${shortLinkRoute}/:shortLinkId`, () => {
    const expectedShortLinkId: ShortLinkId = "shortLinkId";
    it("301 - Redirect on existing short link", async () => {
      const expectedLongLink: AbsoluteUrl = "http://longLink";
      shortLinkQuery.setShortLinks({
        [expectedShortLinkId]: expectedLongLink,
      });

      const response = await request.get(
        `/${shortLinkRoute}/${expectedShortLinkId}`,
      );

      expect(response.header.location).toEqual(expectedLongLink);
      expect(response.status).toBe(302);
    });

    it("404 - Not found on missing short link", async () => {
      const response = await request.get(
        `/${shortLinkRoute}/${expectedShortLinkId}`,
      );

      expect(response.status).toBe(404);
      expectObjectsToMatch(response.body, {
        errors: shortLinkNotFoundMessage(expectedShortLinkId),
      });
    });
  });
});
