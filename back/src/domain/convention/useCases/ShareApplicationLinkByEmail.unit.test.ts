import { expectToEqual, ShareLinkByEmailDto } from "shared";
import { AppConfigBuilder } from "../../../_testBuilders/AppConfigBuilder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryEmailGateway } from "../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { DeterministShortLinkIdGeneratorGateway } from "../../../adapters/secondary/shortLinkIdGeneratorGateway/DeterministShortLinkIdGeneratorGateway";
import { makeShortLinkUrl } from "../../core/ShortLink";
import { ShareApplicationLinkByEmail } from "./ShareApplicationLinkByEmail";

describe("ShareApplicationLinkByEmail", () => {
  it("Sends an SHARE_DRAFT_CONVENTION_BY_LINK email", async () => {
    // Prepare
    const uow = createInMemoryUow();
    const emailGateway = new InMemoryEmailGateway();
    const shortLinkIdGeneratorGateway =
      new DeterministShortLinkIdGeneratorGateway();
    const config = new AppConfigBuilder().build();
    const useCase = new ShareApplicationLinkByEmail(
      new InMemoryUowPerformer(uow),
      emailGateway,
      shortLinkIdGeneratorGateway,
      config,
    );

    const params: ShareLinkByEmailDto = {
      conventionLink: "http://convention.link.fr",
      details: "des détails",
      email: "toto@email.com",
      internshipKind: "immersion",
    };
    const shortLinkId = "link1";
    shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);

    // Act
    await useCase.execute(params);

    // Assert
    expectToEqual(uow.shortLinkQuery.getShortLinks(), {
      [shortLinkId]: params.conventionLink,
    });
    expectToEqual(emailGateway.getSentEmails(), [
      {
        type: "SHARE_DRAFT_CONVENTION_BY_LINK",
        recipients: [params.email],
        params: {
          additionalDetails: params.details,
          conventionFormUrl: makeShortLinkUrl(config, shortLinkId),
          internshipKind: params.internshipKind,
        },
      },
    ]);
  });
});
