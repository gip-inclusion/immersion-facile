import { ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature } from "../../domain/immersionApplication/useCases/notifications/ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature } from "../../domain/immersionApplication/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature";
import { InMemorySireneRepository } from "../../adapters/secondary/InMemorySireneRepository";
import { GetSiret } from "../../domain/sirene/useCases/GetSiret";
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
import { AddImmersionApplication } from "../../domain/immersionApplication/useCases/AddImmersionApplication";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../domain/immersionApplication/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { ValidateImmersionApplication } from "../../domain/immersionApplication/useCases/ValidateImmersionApplication";
import { ImmersionApplicationDto } from "../../shared/ImmersionApplicationDto";
import { AgencyConfigBuilder } from "../../_testBuilders/AgencyConfigBuilder";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../_testBuilders/test.helpers";
import { FeatureFlags } from "../../shared/featureFlags";
import { FeatureFlagsBuilder } from "../../_testBuilders/FeatureFlagsBuilder";
import { NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification } from "../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import { UpdateImmersionApplicationStatus } from "../../domain/immersionApplication/useCases/UpdateImmersionApplicationStatus";
import { createMagicLinkPayload } from "../../shared/tokens/MagicLinkPayload";
import { UpdateImmersionApplication } from "../../domain/immersionApplication/useCases/UpdateImmersionApplication";

const adminEmail = "admin@email.fr";

// Only tests w/ enableEnterpriseSignatures flag.
describe("Add immersionApplication Notifications, then checks the mails are sent (trigerred by events)", () => {
  let addImmersionApplication: AddImmersionApplication;
  let updateImmersionApplication: UpdateImmersionApplication;
  let updateImmersionApplicationStatus: UpdateImmersionApplicationStatus;
  let validateDemandeImmersion: ValidateImmersionApplication;
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
  let validDemandeImmersion: ImmersionApplicationDto;
  let eventBus: EventBus;
  let eventCrawler: BasicEventCrawler;
  let emailFilter: EmailFilter;
  let sentEmails: TemplatedEmail[];
  let agencyConfig: AgencyConfig;
  let getSiret: GetSiret;
  let featureFlags: FeatureFlags;

  beforeEach(() => {
    applicationRepository = new InMemoryImmersionApplicationRepository();
    outboxRepository = new InMemoryOutboxRepository();
    clock = new CustomClock();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    emailGw = new InMemoryEmailGateway();
    validDemandeImmersion = new ImmersionApplicationDtoBuilder()
      .withStatus("READY_TO_SIGN")
      .build();
    eventBus = new InMemoryEventBus();
    eventCrawler = new BasicEventCrawler(eventBus, outboxRepository);
    sireneRepository = new InMemorySireneRepository();
    getSiret = new GetSiret(sireneRepository);
    featureFlags = FeatureFlagsBuilder.allOff()
      .enableEnterpriseSignatures()
      .build();

    addImmersionApplication = new AddImmersionApplication(
      applicationRepository,
      createNewEvent,
      outboxRepository,
      getSiret,
    );
    validateDemandeImmersion = new ValidateImmersionApplication(
      applicationRepository,
      createNewEvent,
      outboxRepository,
    );
    updateImmersionApplicationStatus = new UpdateImmersionApplicationStatus(
      applicationRepository,
      createNewEvent,
      outboxRepository,
      featureFlags,
    );

    emailFilter = new AlwaysAllowEmailFilter();

    agencyConfig = AgencyConfigBuilder.create(validDemandeImmersion.agencyId)
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
        featureFlags,
      );

    confirmToMentorRequestSignature =
      new ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature(
        emailFilter,
        emailGw,
        fakeGenerateMagicLinkUrlFn,
        featureFlags,
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

  // Creates a DemandeImmersion, check it is saved properly and that event had been triggered (thanks to subscription),
  // then check mails have been sent trough the inmemory mail gateway
  test("saves valid applications in the repository", async () => {
    await eventCrawler.processEvents();

    addImmersionApplication = new AddImmersionApplication(
      applicationRepository,
      createNewEvent,
      outboxRepository,
      getSiret,
    );

    updateImmersionApplication = new UpdateImmersionApplication(
      createNewEvent,
      outboxRepository,
      applicationRepository,
      featureFlags,
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
    const result = await addImmersionApplication.execute(validDemandeImmersion);
    expect(result).toEqual({ id: validDemandeImmersion.id });

    // the following line triggers the eventCrawler (in prod it would be triggered every 10sec or so)
    await eventCrawler.processEvents();

    sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(3);

    uuidGenerator.setNextUuid("UUID 2");

    // Not checking any details of the first batch of emails here, as it's tested in another e2e test.

    // Ignoring iat, exp fields for the purpose of this test
    const beneficiaryMLPayload = createMagicLinkPayload(
      validDemandeImmersion.id,
      "beneficiary",
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
      validDemandeImmersion.id,
    );
    expect(updatedImmersion.status === "DRAFT");

    // Now the enterprise goes ahead and implements requested changes and sends back for signatures:
    const mentorMLPayload = createMagicLinkPayload(
      validDemandeImmersion.id,
      "establishment",
    );
    await updateImmersionApplication.execute(
      {
        demandeImmersion: { ...validDemandeImmersion, status: "READY_TO_SIGN" },
        id: validDemandeImmersion.id,
      },
      mentorMLPayload,
    );

    await eventCrawler.processEvents();

    // Expect three emails sent, as if the application was re-submitted again.
    sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(8);
  });
});
