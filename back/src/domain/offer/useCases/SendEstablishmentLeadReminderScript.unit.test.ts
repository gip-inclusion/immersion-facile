import { subDays } from "date-fns";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  expectObjectInArrayToMatch,
  expectToEqual,
} from "shared";
import { AppConfig } from "../../../adapters/primary/config/appConfig";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { DeterministShortLinkIdGeneratorGateway } from "../../../adapters/secondary/shortLinkIdGeneratorGateway/DeterministShortLinkIdGeneratorGateway";
import { AppConfigBuilder } from "../../../utils/AppConfigBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../utils/jwtTestHelper";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationsAndEvents";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { makeSaveNotificationAndRelatedEvent } from "../../generic/notifications/entities/Notification";
import { EstablishmentLead } from "../entities/EstablishmentLeadEntity";
import { SendEstablishmentLeadReminderScript } from "./SendEstablishmentLeadReminderScript";

const now = new Date("2021-05-15T08:00:00.000Z");
const establishmentLeadAccepted: EstablishmentLead = {
  siret: "12345678901234",
  lastEventKind: "registration-accepted",
  events: [
    {
      conventionId: "45664444-1234-4000-4444-123456789013",
      occurredAt: subDays(now, 2),
      kind: "to-be-reminded",
    },
    {
      occurredAt: now,
      kind: "registration-accepted",
    },
  ],
};
const establishmentLeadToBeReminded: EstablishmentLead = {
  siret: "12345678901235",
  lastEventKind: "to-be-reminded",
  events: [
    {
      conventionId: "45664444-1234-4000-4444-123456789012",
      occurredAt: subDays(now, 2),
      kind: "to-be-reminded",
    },
  ],
};

describe("SendEstablishmentLeadReminder", () => {
  const config: AppConfig = new AppConfigBuilder()
    .withTestPresetPreviousKeys()
    .build();
  const timeGateway = new CustomTimeGateway(new Date());
  let uow: InMemoryUnitOfWork;
  let sendEstablishmentLeadReminder: SendEstablishmentLeadReminderScript;
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    sendEstablishmentLeadReminder = new SendEstablishmentLeadReminderScript(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(new UuidV4Generator(), timeGateway),
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator: new UuidV4Generator(),
      }),
      shortLinkIdGeneratorGateway,
      config,
      fakeGenerateMagicLinkUrlFn,
      timeGateway,
    );
  });

  it("Send emails to establishment lead with lastEventKind = 'to-be-reminded", async () => {
    const agency = new AgencyDtoBuilder().build();
    const convention = new ConventionDtoBuilder()
      .withSiret(establishmentLeadToBeReminded.siret)
      .withDateValidation(subDays(now, 2).toISOString())
      .withAgencyId(agency.id)
      .build();
    uow.establishmentLeadRepository.establishmentLeads = [
      establishmentLeadAccepted,
      establishmentLeadToBeReminded,
    ];
    uow.agencyRepository.setAgencies([agency]);
    uow.conventionRepository.setConventions([convention]);
    shortLinkIdGeneratorGateway.addMoreShortLinkIds([
      "addEstablishmentFormShortLink",
      "addUnsubscribeToEmailShortLink",
    ]);

    timeGateway.setNextDates([now, now]);
    // const expectedAddEstablishmentFormUrl = "http://localhost/establishment?siret=12345678901235&bName=Beta.gouv.fr&bAdress=169 boulevard de la villette, 75010 Paris&bcLastName=Prost&bcFirstName=Alain&bcPhone=0601010101&bcEmail=establishment@example.com"

    const result =
      await sendEstablishmentLeadReminder.execute("to-be-reminded");

    expectToEqual(result, {
      establishmentsReminded: [establishmentLeadToBeReminded.siret],
      errors: {},
    });

    expect(
      await uow.shortLinkRepository.getById("addEstablishmentFormShortLink"),
    ).toBe(
      "http://localhost/establishment?siret=12345678901235&bName=Beta.gouv.fr&bAdress=169 boulevard de la villette, 75010 Paris&bcLastName=Prost&bcFirstName=Alain&bcPhone=0601010101&bcEmail=establishment@example.com",
    );

    expect(
      await uow.shortLinkRepository.getById("addUnsubscribeToEmailShortLink"),
    ).toBe(
      "http://fake-magic-link/etablissement/refus-referencement/a99eaca1-ee70-4c90-b3f4-668d492f7392/establishment-representative/2021-05-15T08:00:00.000Z/establishment@example.com",
    );

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "ESTABLISHMENT_LEAD_REMINDER",
          params: {
            businessName: convention.businessName,
            registerEstablishmentShortLink:
              "http://localhost/api/to/addEstablishmentFormShortLink",
            unsubscribeToEmailShortLink:
              "http://localhost/api/to/addUnsubscribeToEmailShortLink",
          },
          recipients: [
            convention.signatories.establishmentRepresentative.email,
          ],
          sender: {
            email: "ne-pas-ecrire-a-cet-email@immersion-facile.beta.gouv.fr",
            name: "Immersion Facilitée",
          },
        },
      ],
    });

    expectObjectInArrayToMatch(uow.outboxRepository.events, [
      {
        topic: "NotificationAdded",
      },
      {
        topic: "SendEstablishmentLeadReminder",
        payload: {
          id: convention.id,
        },
      },
    ]);
  });
});
