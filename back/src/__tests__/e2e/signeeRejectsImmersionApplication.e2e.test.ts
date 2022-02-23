import { AgencyConfigBuilder } from "../../_testBuilders/AgencyConfigBuilder";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../adapters/primary/config";
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
import { InMemorySireneRepository } from "../../adapters/secondary/InMemorySireneRepository";
import { InMemoryUowPerformer } from "../../adapters/secondary/InMemoryUowPerformer";
import { makeStubGetFeatureFlags } from "../../adapters/secondary/makeStubGetFeatureFlags";
import {
  CreateNewEvent,
  EventBus,
  makeCreateNewEvent,
} from "../../domain/core/eventBus/EventBus";
import { EmailFilter } from "../../domain/core/ports/EmailFilter";
import { GetFeatureFlags } from "../../domain/core/ports/GetFeatureFlags";
import { OutboxRepository } from "../../domain/core/ports/OutboxRepository";
import { AgencyConfig } from "../../domain/immersionApplication/ports/AgencyRepository";
import { AddImmersionApplication } from "../../domain/immersionApplication/useCases/AddImmersionApplication";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature } from "../../domain/immersionApplication/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature";
import { ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature } from "../../domain/immersionApplication/useCases/notifications/ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature";
import { NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification } from "../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../domain/immersionApplication/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { UpdateImmersionApplication } from "../../domain/immersionApplication/useCases/UpdateImmersionApplication";
import { UpdateImmersionApplicationStatus } from "../../domain/immersionApplication/useCases/UpdateImmersionApplicationStatus";
import { GetSiret } from "../../domain/sirene/useCases/GetSiret";
import { ImmersionApplicationDto } from "../../shared/ImmersionApplicationDto";
import { createMagicLinkPayload } from "../../shared/tokens/MagicLinkPayload";

const adminEmail = "admin@email.fr";

describe("Add immersionApplication Notifications, then checks the mails are sent (trigerred by events)", () => {
  let addImmersionApplication: AddImmersionApplication;
  let updateImmersionApplication: UpdateImmersionApplication;
  let updateImmersionApplicationStatus: UpdateImmersionApplicationStatus;
  let applicationRepository: InMemoryImmersionApplicationRepository;
  let sireneRepository: InMemorySireneRepository;
  let outboxRepository: OutboxRepository;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;
  let createNewEvent: CreateNewEvent;
  let emailGw: InMemoryEmailGateway;
  let confirmToBeneficiaryRequestSignature: ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature;
  let confirmToMentorRequestSignature: ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature;
  let notifyApplicationNeedsModif: NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification;
  let notifyToTeam: NotifyToTeamApplicationSubmittedByBeneficiary;
  let validImmersionApplication: ImmersionApplicationDto;
  let eventBus: EventBus;
  let eventCrawler: BasicEventCrawler;
  let emailFilter: EmailFilter;
  let sentEmails: TemplatedEmail[];
  let agencyConfig: AgencyConfig;
  let getSiret: GetSiret;
  let getFeatureFlags: GetFeatureFlags;
  let uowPerformer: InMemoryUowPerformer;

  beforeEach(() => {
    applicationRepository = new InMemoryImmersionApplicationRepository();
    outboxRepository = new InMemoryOutboxRepository();
    clock = new CustomClock();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    emailGw = new InMemoryEmailGateway();
    validImmersionApplication = new ImmersionApplicationDtoBuilder()
      .withStatus("READY_TO_SIGN")
      .build();
    eventBus = new InMemoryEventBus();
    eventCrawler = new BasicEventCrawler(eventBus, outboxRepository);
    sireneRepository = new InMemorySireneRepository();
    getSiret = new GetSiret(sireneRepository);
    getFeatureFlags = makeStubGetFeatureFlags({
      enableAdminUi: false,
      enableByPassInseeApi: false,
    });

    uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      immersionApplicationRepo: applicationRepository,
      outboxRepo: outboxRepository,
      getFeatureFlags,
    });

    addImmersionApplication = new AddImmersionApplication(
      uowPerformer,
      createNewEvent,
      getSiret,
    );
    updateImmersionApplicationStatus = new UpdateImmersionApplicationStatus(
      applicationRepository,
      createNewEvent,
      outboxRepository,
    );

    emailFilter = new AlwaysAllowEmailFilter();

    agencyConfig = AgencyConfigBuilder.create(
      validImmersionApplication.agencyId,
    )
      .withName("TEST-name")
      .withAdminEmails([adminEmail])
      .withQuestionnaireUrl("TEST-questionnaireUrl")
      .withSignature("TEST-signature")
      .build();
    const agencyRepository = new InMemoryAgencyRepository([agencyConfig]);

    confirmToBeneficiaryRequestSignature =
      new ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature(
        emailFilter,
        emailGw,
        fakeGenerateMagicLinkUrlFn,
      );

    confirmToMentorRequestSignature =
      new ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature(
        emailFilter,
        emailGw,
        fakeGenerateMagicLinkUrlFn,
      );

    notifyToTeam = new NotifyToTeamApplicationSubmittedByBeneficiary(
      emailGw,
      agencyRepository,
      fakeGenerateMagicLinkUrlFn,
    );

    notifyApplicationNeedsModif =
      new NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification(
        emailFilter,
        emailGw,
        agencyRepository,
        fakeGenerateMagicLinkUrlFn,
      );
  });

  // Creates a ImmersionApplication, check it is saved properly and that event had been triggered (thanks to subscription),
  // then check mails have been sent trough the inmemory mail gateway
  test("saves valid applications in the repository", async () => {
    await eventCrawler.processEvents();

    addImmersionApplication = new AddImmersionApplication(
      uowPerformer,
      createNewEvent,
      getSiret,
    );

    updateImmersionApplication = new UpdateImmersionApplication(
      uowPerformer,
      createNewEvent,
    );

    eventBus.subscribe("ImmersionApplicationSubmittedByBeneficiary", (event) =>
      confirmToBeneficiaryRequestSignature.execute(event.payload),
    );

    eventBus.subscribe("ImmersionApplicationSubmittedByBeneficiary", (event) =>
      confirmToMentorRequestSignature.execute(event.payload),
    );

    eventBus.subscribe("ImmersionApplicationSubmittedByBeneficiary", (event) =>
      notifyToTeam.execute(event.payload),
    );

    eventBus.subscribe("ImmersionApplicationRequiresModification", (event) =>
      notifyApplicationNeedsModif.execute(event.payload),
    );

    // We expect this execute to trigger an event on ImmersionApplicationSubmittedByBeneficiary topic
    const result = await addImmersionApplication.execute(
      validImmersionApplication,
    );
    expect(result).toEqual({ id: validImmersionApplication.id });
    const applicationsInRepo = await applicationRepository.getAll();
    expect(applicationsInRepo).toHaveLength(1);
    // the following line triggers the eventCrawler (in prod it would be triggered every 10sec or so)
    await eventCrawler.processEvents();

    sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(3);

    uuidGenerator.setNextUuid("UUID 2");

    // Not checking any details of the first batch of emails here, as it's tested in another e2e test.

    // Ignoring iat, exp fields for the purpose of this test
    const beneficiaryMLPayload = createMagicLinkPayload(
      validImmersionApplication.id,
      "beneficiary",
      validImmersionApplication.email,
    );
    const resultRequestModif = await updateImmersionApplicationStatus.execute(
      { justification: "test justification", status: "DRAFT" },
      beneficiaryMLPayload,
    );
    await eventCrawler.processEvents();

    uuidGenerator.setNextUuid("UUID 3");

    // Expect two emails sent (to beneficiary and to mentor)
    sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(5);

    const updatedImmersion = await applicationRepository.getById(
      validImmersionApplication.id,
    );
    expect(updatedImmersion.status === "DRAFT");

    // Now the enterprise goes ahead and implements requested changes and sends back for signatures:
    const mentorMLPayload = createMagicLinkPayload(
      validImmersionApplication.id,
      "establishment",
      validImmersionApplication.mentorEmail,
    );
    await updateImmersionApplication.execute(
      {
        immersionApplication: {
          ...validImmersionApplication,
          status: "READY_TO_SIGN",
        },
        id: validImmersionApplication.id,
      },
      mentorMLPayload,
    );

    await eventCrawler.processEvents();

    // Expect three emails sent, as if the application was re-submitted again.
    sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(8);
  });
});
