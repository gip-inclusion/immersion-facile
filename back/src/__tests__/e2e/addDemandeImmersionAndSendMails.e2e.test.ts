import { CustomClock } from "../../adapters/secondary/core/ClockImplementations";
import { BasicEventCrawler } from "../../adapters/secondary/core/EventCrawlerImplementations";
import { InMemoryOutboxRepository } from "../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryDemandeImmersionRepository } from "../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { InMemoryEmailGateway } from "../../adapters/secondary/InMemoryEmailGateway";
import { InMemoryEventBus } from "../../adapters/secondary/InMemoryEventBus";
import {
  CreateNewEvent,
  EventBus,
  makeCreateNewEvent,
} from "../../domain/core/eventBus/EventBus";
import { OutboxRepository } from "../../domain/core/ports/OutboxRepository";
import { AddDemandeImmersion } from "../../domain/demandeImmersion/useCases/AddDemandeImmersion";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmitted } from "../../domain/demandeImmersion/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmitted";
import { ConfirmToMentorThatApplicationCorrectlySubmitted } from "../../domain/demandeImmersion/useCases/notifications/ConfirmToMentorThatApplicationCorrectlySubmitted";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../domain/demandeImmersion/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import {
  ApplicationSource,
  DemandeImmersionDto,
} from "../../shared/DemandeImmersionDto";
import { DemandeImmersionDtoBuilder } from "../../_testBuilders/DemandeImmersionDtoBuilder";
import {
  expectEmailAdminNotificationMatchingImmersionApplication,
  expectEmailBeneficiaryConfirmationMatchingImmersionApplication,
  expectEmailMentorConfirmationMatchingImmersionApplication,
} from "../../_testBuilders/emailAssertions";

describe("Add demandeImmersion Notifications, then checks the mails are sent (trigerred by events)", () => {
  let addDemandeImmersion: AddDemandeImmersion;
  let applicationRepository: InMemoryDemandeImmersionRepository;
  let outboxRepository: OutboxRepository;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;
  let createNewEvent: CreateNewEvent;
  let emailGw: InMemoryEmailGateway;
  let confirmToBeneficiary: ConfirmToBeneficiaryThatApplicationCorrectlySubmitted;
  let confirmToMentor: ConfirmToMentorThatApplicationCorrectlySubmitted;
  let notifyToTeam: NotifyToTeamApplicationSubmittedByBeneficiary;
  let validDemandeImmersion: DemandeImmersionDto;
  let eventBus: EventBus;
  let eventCrawler: BasicEventCrawler;
  let aSupervisorEmail: string;
  let emailAllowList: Set<string>;
  let unrestrictedEmailSendingSources: Set<ApplicationSource>;

  beforeEach(() => {
    applicationRepository = new InMemoryDemandeImmersionRepository();
    outboxRepository = new InMemoryOutboxRepository();
    clock = new CustomClock();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    emailGw = new InMemoryEmailGateway();
    validDemandeImmersion = new DemandeImmersionDtoBuilder().build();
    eventBus = new InMemoryEventBus();
    eventCrawler = new BasicEventCrawler(eventBus, outboxRepository);

    addDemandeImmersion = new AddDemandeImmersion(
      applicationRepository,
      createNewEvent,
      outboxRepository
    );
    aSupervisorEmail = "supervisor@email.fr";
    emailAllowList = new Set([
      validDemandeImmersion.email,
      validDemandeImmersion.mentorEmail,
    ]);
    unrestrictedEmailSendingSources = new Set();

    confirmToBeneficiary =
      new ConfirmToBeneficiaryThatApplicationCorrectlySubmitted(
        emailGw,
        emailAllowList,
        unrestrictedEmailSendingSources
      );

    confirmToMentor = new ConfirmToMentorThatApplicationCorrectlySubmitted(
      emailGw,
      emailAllowList,
      unrestrictedEmailSendingSources
    );

    notifyToTeam = new NotifyToTeamApplicationSubmittedByBeneficiary(
      emailGw,
      aSupervisorEmail
    );
  });

  //Creates a DemandeImmersion, check it is saved proberly and that event had been triggered (thanks to subscription), then check mails have been sent trough the inmemory mail gateway
  test("saves valid applications in the repository", async () => {
    eventBus.subscribe("ImmersionApplicationSubmittedByBeneficiary", (event) =>
      confirmToBeneficiary.execute(event.payload)
    );

    eventBus.subscribe("ImmersionApplicationSubmittedByBeneficiary", (event) =>
      confirmToMentor.execute(event.payload)
    );

    eventBus.subscribe("ImmersionApplicationSubmittedByBeneficiary", (event) =>
      notifyToTeam.execute(event.payload)
    );

    // We expect this execute to trigger an event on ImmersionApplicationSubmittedByBeneficiary topic
    const result = await addDemandeImmersion.execute(validDemandeImmersion);
    expect(result).toEqual({ id: validDemandeImmersion.id });

    // the following line triggers the eventCrawler (in prod it would be triggered every 10sec or so)
    await eventCrawler.processEvents();

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(3);

    expectEmailBeneficiaryConfirmationMatchingImmersionApplication(
      sentEmails[0],
      validDemandeImmersion
    );

    expectEmailMentorConfirmationMatchingImmersionApplication(
      sentEmails[1],
      validDemandeImmersion
    );

    expectEmailAdminNotificationMatchingImmersionApplication(sentEmails[2], {
      recipient: "supervisor@email.fr",
      immersionApplication: validDemandeImmersion,
    });
  });
});
