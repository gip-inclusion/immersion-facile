import {
  type AbsoluteUrl,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import type { ShortLink } from "../ports/ShortLinkQuery";
import { type GetLink, makeGetLink } from "./GetLink";

describe("GetLink", () => {
  let getLink: GetLink;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;

  const shortLinkId = "shortLinkId";
  const longUrl: AbsoluteUrl = "https://example.com/sign?jwt=abc";
  const initialShortLink: ShortLink = {
    id: shortLinkId,
    url: longUrl,
    lastUsedAt: null,
  };

  beforeEach(() => {
    timeGateway = new CustomTimeGateway();
    uow = createInMemoryUow();
    getLink = makeGetLink({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        timeGateway,
      },
    });
    uow.shortLinkQuery.setShortLinks([initialShortLink]);
  });

  it("redirects to long URL and update lastused link date", async () => {
    expectToEqual(await getLink.execute(shortLinkId), longUrl);
    expectToEqual(await uow.shortLinkQuery.getById(shortLinkId), {
      ...initialShortLink,
      lastUsedAt: timeGateway.now(),
    });
  });

  it("throw not found on missing short link", async () => {
    const shortLinkId = "missing";
    expectPromiseToFailWithError(
      getLink.execute(shortLinkId),
      errors.shortLink.notFound({ shortLinkId }),
    );
  });
});
