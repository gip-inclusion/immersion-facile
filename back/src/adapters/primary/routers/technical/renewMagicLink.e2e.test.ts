import {
  AbsoluteUrl,
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  createConventionMagicLinkPayload,
  expectEmailOfType,
  RenewMagicLinkRequestDto,
  TemplatedEmail,
} from "shared";
import {
  GenerateMagicLinkJwt,
  makeGenerateJwtES256,
  makeVerifyJwtES256,
} from "../../../../domain/auth/jwt";
import { DeliverRenewedMagicLink } from "../../../../domain/convention/useCases/notifications/DeliverRenewedMagicLink";
import { RenewConventionMagicLink } from "../../../../domain/convention/useCases/RenewConventionMagicLink";
import {
  EventBus,
  makeCreateNewEvent,
} from "../../../../domain/core/eventBus/EventBus";
import { AppConfigBuilder } from "../../../../_testBuilders/AppConfigBuilder";
import { BasicEventCrawler } from "../../../secondary/core/EventCrawlerImplementations";
import { InMemoryEventBus } from "../../../secondary/core/InMemoryEventBus";
import { CustomTimeGateway } from "../../../secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../secondary/core/UuidGeneratorImplementations";
import { InMemoryEmailGateway } from "../../../secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryConventionRepository } from "../../../secondary/InMemoryConventionRepository";
import { InMemoryUowPerformer } from "../../../secondary/InMemoryUowPerformer";
import { AppConfig } from "../../config/appConfig";
import { createInMemoryUow } from "../../config/uowConfig";

const adminEmail = "admin@email.fr";

const validConvention = new ConventionDtoBuilder().build();

const agency = AgencyDtoBuilder.create(validConvention.agencyId)
  .withName("TEST-name")
  .withAdminEmails([adminEmail])
  .withQuestionnaireUrl("TEST-questionnaireUrl")
  .withSignature("TEST-signature")
  .build();

const immersionBaseUrl: AbsoluteUrl = "http://fake-immersion.com";

describe("Magic link renewal flow", () => {
  let conventionRepository: InMemoryConventionRepository;
  let timeGateway: CustomTimeGateway;
  let emailGw: InMemoryEmailGateway;
  let eventBus: EventBus;
  let eventCrawler: BasicEventCrawler;
  let sentEmails: TemplatedEmail[];
  let renewMagicLink: RenewConventionMagicLink;
  let deliverRenewedMagicLink: DeliverRenewedMagicLink;
  let config: AppConfig;
  let generateJwtFn: GenerateMagicLinkJwt;

  beforeEach(() => {
    const uow = createInMemoryUow();

    uow.agencyRepository.setAgencies([agency]);

    conventionRepository = uow.conventionRepository;
    timeGateway = new CustomTimeGateway();
    timeGateway.setNextDate(new Date());

    const uowPerformer = new InMemoryUowPerformer(uow);
    emailGw = new InMemoryEmailGateway(timeGateway);
    eventBus = new InMemoryEventBus(timeGateway, uowPerformer);
    eventCrawler = new BasicEventCrawler(uowPerformer, eventBus);

    config = new AppConfigBuilder().withTestPresetPreviousKeys().build();

    generateJwtFn = makeGenerateJwtES256(config.magicLinkJwtPrivateKey);

    renewMagicLink = new RenewConventionMagicLink(
      uowPerformer,
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator: new TestUuidGenerator(),
      }),
      generateJwtFn,
      config,
      timeGateway,
      immersionBaseUrl,
    );

    deliverRenewedMagicLink = new DeliverRenewedMagicLink(emailGw);

    const entity = new ConventionDtoBuilder().build();
    conventionRepository.setConventions({ [entity.id]: entity });
  });

  it("sends the updated magic link", async () => {
    eventBus.subscribe("MagicLinkRenewalRequested", "subscription1", (event) =>
      deliverRenewedMagicLink.execute(event.payload),
    );

    const payload = createConventionMagicLinkPayload({
      id: validConvention.id,
      role: "beneficiary",
      email: validConvention.signatories.beneficiary.email,
      now: new Date(),
    });

    const request: RenewMagicLinkRequestDto = {
      originalUrl: "immersionfacile.fr/verifier-et-signer",
      expiredJwt: generateJwtFn(payload),
    };

    await renewMagicLink.execute(request);
    await eventCrawler.processNewEvents();

    sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);

    const email = expectEmailOfType(sentEmails[0], "MAGIC_LINK_RENEWAL");

    expect(email.recipients).toEqual([
      validConvention.signatories.beneficiary.email,
    ]);

    const ml = email.params.magicLink as string;
    const newUrlStart = `${immersionBaseUrl}/verifier-et-signer?jwt=`;
    expect(ml.startsWith(newUrlStart)).toBeTruthy();
    const jwt = ml.replace(newUrlStart, "");

    const verifyJwt = makeVerifyJwtES256(config.magicLinkJwtPublicKey);
    expect(verifyJwt(jwt)).toBeDefined();
  });
});
