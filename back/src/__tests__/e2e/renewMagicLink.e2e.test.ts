import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  createConventionMagicLinkPayload,
  RenewMagicLinkRequestDto,
  TemplatedEmail,
} from "shared";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";
import { expectEmailOfType } from "../../_testBuilders/test.helpers";
import { AppConfig } from "../../adapters/primary/config/appConfig";
import { createInMemoryUow } from "../../adapters/primary/config/uowConfig";
import { CustomClock } from "../../adapters/secondary/core/ClockImplementations";
import { BasicEventCrawler } from "../../adapters/secondary/core/EventCrawlerImplementations";
import { InMemoryEventBus } from "../../adapters/secondary/core/InMemoryEventBus";
import { TestUuidGenerator } from "../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryEmailGateway } from "../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryConventionRepository } from "../../adapters/secondary/InMemoryConventionRepository";
import { InMemoryUowPerformer } from "../../adapters/secondary/InMemoryUowPerformer";
import {
  GenerateMagicLinkJwt,
  makeGenerateJwtES256,
  makeVerifyJwtES256,
} from "../../domain/auth/jwt";
import { DeliverRenewedMagicLink } from "../../domain/convention/useCases/notifications/DeliverRenewedMagicLink";
import { RenewConventionMagicLink } from "../../domain/convention/useCases/RenewConventionMagicLink";
import {
  CreateNewEvent,
  EventBus,
  makeCreateNewEvent,
} from "../../domain/core/eventBus/EventBus";

const adminEmail = "admin@email.fr";

const validConvention = new ConventionDtoBuilder().build();

const agency = AgencyDtoBuilder.create(validConvention.agencyId)
  .withName("TEST-name")
  .withAdminEmails([adminEmail])
  .withQuestionnaireUrl("TEST-questionnaireUrl")
  .withSignature("TEST-signature")
  .build();

describe("Magic link renewal flow", () => {
  let conventionRepository: InMemoryConventionRepository;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;
  let createNewEvent: CreateNewEvent;
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

    const agencyRepository = uow.agencyRepository;
    agencyRepository.setAgencies([agency]);
    conventionRepository = uow.conventionRepository;
    clock = new CustomClock();
    clock.setNextDate(new Date());
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    const uowPerformer = new InMemoryUowPerformer(uow);
    emailGw = new InMemoryEmailGateway(clock);
    eventBus = new InMemoryEventBus(clock, uowPerformer);
    eventCrawler = new BasicEventCrawler(uowPerformer, eventBus);

    config = new AppConfigBuilder().withTestPresetPreviousKeys().build();

    generateJwtFn = makeGenerateJwtES256(config.magicLinkJwtPrivateKey);

    renewMagicLink = new RenewConventionMagicLink(
      uowPerformer,
      createNewEvent,
      generateJwtFn,
      config,
      clock,
    );

    deliverRenewedMagicLink = new DeliverRenewedMagicLink(emailGw);

    const entity = new ConventionDtoBuilder().build();
    conventionRepository.setConventions({ [entity.id]: entity });
  });

  it("sends the updated magic link", async () => {
    eventBus.subscribe("MagicLinkRenewalRequested", "subscription1", (event) =>
      deliverRenewedMagicLink.execute(event.payload),
    );

    const payload = createConventionMagicLinkPayload(
      validConvention.id,
      "beneficiary",
      validConvention.signatories.beneficiary.email,
    );

    const request: RenewMagicLinkRequestDto = {
      linkFormat: "immersionfacile.fr/%jwt%",
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
    expect(ml.startsWith("immersionfacile.fr/")).toBeTruthy();
    const jwt = ml.replace("immersionfacile.fr/", "");

    const verifyJwt = makeVerifyJwtES256(config.magicLinkJwtPublicKey);
    expect(verifyJwt(jwt)).toBeDefined();
  });
});
