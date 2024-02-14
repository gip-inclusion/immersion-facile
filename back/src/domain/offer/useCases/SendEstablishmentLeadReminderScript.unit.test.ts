import { subDays, subHours } from "date-fns";
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

const establishmentLeadWithOneReminderSentSevenDaysAgo: EstablishmentLead = {
  siret: "12345678901236",
  lastEventKind: "reminder-sent",
  events: [
    {
      conventionId: "45664444-1234-4000-4444-123456789012",
      occurredAt: subDays(now, 8),
      kind: "to-be-reminded",
    },
    {
      kind: "reminder-sent",
      occurredAt: subDays(subHours(now, 2), 7),
      notification: { id: "first-notification-id", kind: "email" },
    },
  ],
};
const establishmentLeadWithOneReminderSentYesterday: EstablishmentLead = {
  siret: "12345678901230",
  lastEventKind: "reminder-sent",
  events: [
    {
      conventionId: "45664444-1234-4000-4444-123456789014",
      occurredAt: subDays(now, 8),
      kind: "to-be-reminded",
    },
    {
      kind: "reminder-sent",
      occurredAt: subDays(now, 1),
      notification: { id: "first-notification-id", kind: "email" },
    },
  ],
};

const establishmentLeadWithTwoRemindersSent: EstablishmentLead = {
  siret: "12345678901237",
  lastEventKind: "reminder-sent",
  events: [
    {
      conventionId: "45664444-1234-4000-4444-123456789013",
      occurredAt: subDays(now, 15),
      kind: "to-be-reminded",
    },
    {
      kind: "reminder-sent",
      occurredAt: subDays(now, 14),
      notification: { id: "first-notification-id", kind: "email" },
    },
    {
      kind: "reminder-sent",
      occurredAt: subDays(now, 7),
      notification: { id: "second-notification-id", kind: "email" },
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

  describe("Send first reminder", () => {
    it("Send emails to establishment lead when lastEventKind = 'to-be-reminded", async () => {
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

      const result = await sendEstablishmentLeadReminder.execute({
        kind: "to-be-reminded",
      });

      expectToEqual(result, {
        establishmentsReminded: [establishmentLeadToBeReminded.siret],
        errors: {},
      });

      expect(
        await uow.shortLinkRepository.getById("addEstablishmentFormShortLink"),
      ).toBe(
        "http://localhost/establishment?siret=12345678901235&bcLastName=Idol&bcFirstName=Billy&bcPhone=0602010203&bcEmail=establishment@example.com",
      );

      expect(
        await uow.shortLinkRepository.getById("addUnsubscribeToEmailShortLink"),
      ).toBe(
        "http://fake-magic-link/desinscription-prospect/a99eaca1-ee70-4c90-b3f4-668d492f7392/establishment-representative/2021-05-15T08:00:00.000Z/establishment@example.com",
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

      expect(
        (await uow.establishmentLeadRepository.getBySiret(convention.siret))
          ?.lastEventKind,
      ).toBe("reminder-sent");
    });
  });

  describe("Send second reminder", () => {
    it("Send emails to establishment lead when lastEventKind ='reminder-sent' and only one reminder event sent 7 day ago", async () => {
      const agency = new AgencyDtoBuilder().build();

      const convention1 = new ConventionDtoBuilder()
        .withId("45664444-1234-4000-4444-123456789012")
        .withSiret(establishmentLeadWithOneReminderSentSevenDaysAgo.siret)
        .withDateValidation(subDays(now, 2).toISOString())
        .withAgencyId(agency.id)
        .build();

      const convention2 = new ConventionDtoBuilder()
        .withId("45664444-1234-4000-4444-123456789013")
        .withSiret(establishmentLeadWithTwoRemindersSent.siret)
        .withDateValidation(subDays(now, 2).toISOString())
        .withAgencyId(agency.id)
        .build();

      const convention3 = new ConventionDtoBuilder()
        .withId("45664444-1234-4000-4444-123456789014")
        .withSiret(establishmentLeadWithOneReminderSentYesterday.siret)
        .withDateValidation(subDays(now, 2).toISOString())
        .withAgencyId(agency.id)
        .build();

      uow.establishmentLeadRepository.establishmentLeads = [
        establishmentLeadWithOneReminderSentSevenDaysAgo,
        establishmentLeadWithTwoRemindersSent,
        establishmentLeadWithOneReminderSentYesterday,
      ];

      uow.agencyRepository.setAgencies([agency]);
      uow.conventionRepository.setConventions([
        convention1,
        convention2,
        convention3,
      ]);
      shortLinkIdGeneratorGateway.addMoreShortLinkIds([
        "addEstablishmentFormShortLink",
        "addUnsubscribeToEmailShortLink",
      ]);
      timeGateway.setNextDates([now, now]);

      const result = await sendEstablishmentLeadReminder.execute({
        kind: "reminder-sent",
        beforeDate: subDays(now, 7),
      });

      expectToEqual(result, {
        establishmentsReminded: [
          establishmentLeadWithOneReminderSentSevenDaysAgo.siret,
        ],
        errors: {},
      });

      expect(
        await uow.shortLinkRepository.getById("addEstablishmentFormShortLink"),
      ).toBe(
        "http://localhost/establishment?siret=12345678901236&bcLastName=Idol&bcFirstName=Billy&bcPhone=0602010203&bcEmail=establishment@example.com",
      );

      expect(
        await uow.shortLinkRepository.getById("addUnsubscribeToEmailShortLink"),
      ).toBe(
        "http://fake-magic-link/desinscription-prospect/45664444-1234-4000-4444-123456789012/establishment-representative/2021-05-15T08:00:00.000Z/establishment@example.com",
      );

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ESTABLISHMENT_LEAD_REMINDER",
            params: {
              businessName: convention1.businessName,
              registerEstablishmentShortLink:
                "http://localhost/api/to/addEstablishmentFormShortLink",
              unsubscribeToEmailShortLink:
                "http://localhost/api/to/addUnsubscribeToEmailShortLink",
            },
            recipients: [
              convention1.signatories.establishmentRepresentative.email,
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
            id: convention1.id,
          },
        },
      ]);

      expect(
        (await uow.establishmentLeadRepository.getBySiret(convention1.siret))
          ?.lastEventKind,
      ).toBe("reminder-sent");
    });
  });
});
