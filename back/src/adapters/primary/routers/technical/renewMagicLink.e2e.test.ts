import supertest from "supertest";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  createConventionMagicLinkPayload,
  expectEmailOfType,
  frontRoutes,
  queryParamsAsString,
  RenewMagicLinkRequestDto,
  renewMagicLinkRoute,
} from "shared";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../../../_testBuilders/buildTestApp";
import {
  GenerateConventionJwt,
  makeGenerateJwtES256,
  makeVerifyJwtES256,
} from "../../../../domain/auth/jwt";
import { shortLinkRedirectToLinkWithValidation } from "../../../../utils/e2eTestHelpers";
import { BasicEventCrawler } from "../../../secondary/core/EventCrawlerImplementations";
import { AppConfig } from "../../config/appConfig";
import { InMemoryUnitOfWork } from "../../config/uowConfig";

const validConvention = new ConventionDtoBuilder().build();

const agency = AgencyDtoBuilder.create(validConvention.agencyId)
  .withName("TEST-name")
  .withAdminEmails(["admin@email.fr"])
  .withQuestionnaireUrl("TEST-questionnaireUrl")
  .withSignature("TEST-signature")
  .build();

describe("Magic link renewal flow", () => {
  let request: supertest.SuperTest<supertest.Test>;
  let gateways: InMemoryGateways;
  let eventCrawler: BasicEventCrawler;
  let inMemoryUow: InMemoryUnitOfWork;
  let appConfig: AppConfig;
  let generateConventionJwt: GenerateConventionJwt;

  beforeEach(async () => {
    ({ request, gateways, eventCrawler, inMemoryUow, appConfig } =
      await buildTestApp());

    inMemoryUow.agencyRepository.setAgencies([agency]);

    gateways.timeGateway.setNextDate(new Date());

    generateConventionJwt = makeGenerateJwtES256<"convention">(
      appConfig.jwtPrivateKey,
      3600 * 24, // one day
    );

    const convention = new ConventionDtoBuilder().build();
    inMemoryUow.conventionRepository.setConventions({
      [convention.id]: convention,
    });
  });

  it("sends the updated magic link", async () => {
    const shortLinkIds = ["shortLink1", "shortLinkg2"];
    gateways.shortLinkGenerator.addMoreShortLinkIds(shortLinkIds);

    const originalUrl = `${appConfig.immersionFacileBaseUrl}/${frontRoutes.conventionToSign}`;

    const expiredJwt = generateConventionJwt(
      createConventionMagicLinkPayload({
        id: validConvention.id,
        role: "beneficiary",
        email: validConvention.signatories.beneficiary.email,
        now: new Date(),
      }),
    );

    const queryParams = queryParamsAsString<RenewMagicLinkRequestDto>({
      expiredJwt,
      originalUrl: encodeURIComponent(originalUrl),
    });

    const response = await request
      .get(`/${renewMagicLinkRoute}?${queryParams}`)
      .send();

    expect(response.status).toBe(200);

    await eventCrawler.processNewEvents();

    const sentEmails = gateways.notification.getSentEmails();

    expect(sentEmails).toHaveLength(1);

    const email = expectEmailOfType(sentEmails[0], "MAGIC_LINK_RENEWAL");
    expect(email.recipients).toEqual([
      validConvention.signatories.beneficiary.email,
    ]);

    const magicLink = await shortLinkRedirectToLinkWithValidation(
      email.params.magicLink,
      request,
    );

    const newUrlStart = `${originalUrl}?jwt=`;

    expect(magicLink.startsWith(newUrlStart)).toBeTruthy();
    const renewedJwt = magicLink.replace(newUrlStart, "");
    expect(renewedJwt !== expiredJwt).toBeTruthy();
    expect(
      makeVerifyJwtES256(appConfig.jwtPublicKey)(renewedJwt),
    ).toBeDefined();
  });
});
