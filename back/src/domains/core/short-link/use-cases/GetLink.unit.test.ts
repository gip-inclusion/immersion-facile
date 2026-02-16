import { type AbsoluteUrl, expectToEqual, frontRoutes } from "shared";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { createInMemoryUow } from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { makeGetLink } from "./GetLink";

describe("GetLink", () => {
  const shortLinkId = "shortLinkId";
  const timeGateway = new CustomTimeGateway();
  const uow = createInMemoryUow();
  const config = new AppConfigBuilder().build();
  const immersionFacileBaseUrl = config.immersionFacileBaseUrl;
  const uowPerformer = new InMemoryUowPerformer(uow);
  const getLink = makeGetLink({
    uowPerformer,
    deps: {
      timeGateway,
      immersionFacileBaseUrl,
    },
  });

  it("redirects to long URL for multiple-use link", async () => {
    const longUrl: AbsoluteUrl = "https://example.com/sign?jwt=abc";
    uow.shortLinkQuery.setShortLinks({
      [shortLinkId]: { url: longUrl, singleUse: false, lastUsedAt: null },
    });

    const result = await getLink.execute(shortLinkId);

    expectToEqual(result, longUrl);
  });

  it("redirects to long URL and marks as used for single-use link first use", async () => {
    const longUrl: AbsoluteUrl = "https://example.com/sign?jwt=abc";
    uow.shortLinkQuery.setShortLinks({
      [shortLinkId]: {
        url: longUrl,
        singleUse: true,
        lastUsedAt: null,
      },
    });

    const usedAtDate = new Date("2026-02-12");

    timeGateway.setNextDate(usedAtDate);

    const result = await getLink.execute(shortLinkId);

    expectToEqual(result, longUrl);

    const shortLink = await uow.shortLinkQuery.getById(shortLinkId);
    expectToEqual(shortLink, {
      url: longUrl,
      singleUse: true,
      lastUsedAt: usedAtDate,
    });
  });

  it("redirects to link already used page with jwt when single-use link already used", async () => {
    const expiredJwt = "eyJhbGciOiJIUzI1NiJ9";
    const longUrl: AbsoluteUrl = `https://example.com/test?jwt=${expiredJwt}`;
    uow.shortLinkQuery.setShortLinks({
      [shortLinkId]: {
        url: longUrl,
        singleUse: true,
        lastUsedAt: new Date("2026-02-11"),
      },
    });

    const result = await getLink.execute(shortLinkId);

    expectToEqual(
      result,
      `${immersionFacileBaseUrl}/${frontRoutes.linkAlreadyUsed}?jwt=${expiredJwt}`,
    );
  });
});
