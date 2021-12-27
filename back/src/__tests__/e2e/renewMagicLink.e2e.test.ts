import { DeliverRenewedMagicLink } from "./../../domain/immersionApplication/useCases/notifications/DeliverRenewedMagicLink";
import { CustomClock } from "../../adapters/secondary/core/ClockImplementations";
import { AlwaysAllowEmailFilter } from "../../adapters/secondary/core/EmailFilterImplementations";
import { BasicEventCrawler } from "../../adapters/secondary/core/EventCrawlerImplementations";
import { InMemoryEventBus } from "../../adapters/secondary/core/InMemoryEventBus";
import { InMemoryOutboxRepository } from "../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryAgencyRepository } from "../../adapters/secondary/InMemoryAgencyRepository";
import {
  InMemoryEmailGateway,
  TemplatedEmail,
} from "../../adapters/secondary/InMemoryEmailGateway";
import { InMemoryImmersionApplicationRepository } from "../../adapters/secondary/InMemoryImmersionApplicationRepository";
import {
  CreateNewEvent,
  EventBus,
  makeCreateNewEvent,
} from "../../domain/core/eventBus/EventBus";
import { EmailFilter } from "../../domain/core/ports/EmailFilter";
import { OutboxRepository } from "../../domain/core/ports/OutboxRepository";
import { AgencyConfig } from "../../domain/immersionApplication/ports/AgencyRepository";
import {
  ImmersionApplicationDto,
  RenewMagicLinkRequestDto,
} from "../../shared/ImmersionApplicationDto";
import { AgencyConfigBuilder } from "../../_testBuilders/AgencyConfigBuilder";
import { expectEmailMatchingLinkRenewalEmail } from "../../_testBuilders/emailAssertions";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { RenewMagicLink } from "../../domain/immersionApplication/useCases/RenewMagicLink";
import { GenerateMagicLinkJwt } from "../../domain/auth/jwt";
import {
  createMagicLinkPayload,
  emailHashForMagicLink,
  MagicLinkPayload,
} from "../../shared/tokens/MagicLinkPayload";
import { ImmersionApplicationEntityBuilder } from "../../_testBuilders/ImmersionApplicationEntityBuilder";

const adminEmail = "admin@email.fr";

describe("Magic link renewal flow", () => {
  let applicationRepository: InMemoryImmersionApplicationRepository;
  let outboxRepository: OutboxRepository;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;
  let createNewEvent: CreateNewEvent;
  let emailGw: InMemoryEmailGateway;
  let validDemandeImmersion: ImmersionApplicationDto;
  let eventBus: EventBus;
  let eventCrawler: BasicEventCrawler;
  let emailFilter: EmailFilter;
  let sentEmails: TemplatedEmail[];
  let agencyConfig: AgencyConfig;
  let renewMagicLink: RenewMagicLink;
  let deliverRenewedMagicLink: DeliverRenewedMagicLink;

  const generateJwtFn: GenerateMagicLinkJwt = (payload: MagicLinkPayload) => {
    return payload.applicationId + "; " + payload.role;
  };

  beforeEach(() => {
    applicationRepository = new InMemoryImmersionApplicationRepository();
    outboxRepository = new InMemoryOutboxRepository();
    clock = new CustomClock();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    emailGw = new InMemoryEmailGateway();
    validDemandeImmersion = new ImmersionApplicationDtoBuilder().build();
    eventBus = new InMemoryEventBus();
    eventCrawler = new BasicEventCrawler(eventBus, outboxRepository);

    emailFilter = new AlwaysAllowEmailFilter();

    agencyConfig = AgencyConfigBuilder.create(validDemandeImmersion.agencyId)
      .withName("TEST-name")
      .withAdminEmails([adminEmail])
      .withQuestionnaireUrl("TEST-questionnaireUrl")
      .withSignature("TEST-signature")
      .build();
    const agencyRepository = new InMemoryAgencyRepository([agencyConfig]);

    renewMagicLink = new RenewMagicLink(
      applicationRepository,
      createNewEvent,
      outboxRepository,
      agencyRepository,
      generateJwtFn,
    );

    deliverRenewedMagicLink = new DeliverRenewedMagicLink(emailFilter, emailGw);

    const entity = new ImmersionApplicationEntityBuilder().build();
    applicationRepository.setDemandesImmersion({ [entity.id]: entity });
  });

  test("sends the updated magic link", async () => {
    eventBus.subscribe("MagicLinkRenewalRequested", (event) =>
      deliverRenewedMagicLink.execute(event.payload),
    );

    const linkFormat = "immersionfacile.fr/%jwt%";
    const request: RenewMagicLinkRequestDto = {
      applicationId: validDemandeImmersion.id,
      role: "beneficiary",
      linkFormat,
      emailHash: emailHashForMagicLink(validDemandeImmersion.email),
    };

    await renewMagicLink.execute(request);

    const expectedJWT = generateJwtFn(
      createMagicLinkPayload(
        validDemandeImmersion.id,
        "beneficiary",
        validDemandeImmersion.email,
      ),
    );

    await eventCrawler.processEvents();

    sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectEmailMatchingLinkRenewalEmail(
      sentEmails[0],
      validDemandeImmersion.email,
      "immersionfacile.fr/" + expectedJWT,
    );
  });
});
