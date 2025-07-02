import { subDays } from "date-fns";
import {
  type ContactMode,
  cartographeAppellationAndRome,
  createOpaqueEmail,
  DiscussionBuilder,
  type DiscussionDto,
  type DiscussionKind,
  expectToEqual,
  getFormattedFirstnameAndLastname,
  immersionFacileNoReplyEmailSender,
  type TemplatedEmail,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { EstablishmentAggregateBuilder } from "../helpers/EstablishmentBuilders";
import {
  type ContactRequestReminder,
  type ContactRequestReminderMode,
  makeContactRequestReminder,
} from "./ContactRequestReminder";

describe("ContactRequestReminder", () => {
  let timeGateway: CustomTimeGateway;
  const now = new Date();
  const domain = "domain.fr";

  const [
    discussionWith2DaysSinceBeneficiaryExchange,
    discussionWith3DaysSinceBeneficiaryExchange,
    discussionWith3DaysSinceBeneficiaryExchangeWithContactModePhone,
    discussionWith4DaysSinceBeneficiaryExchange,
    discussionWith6DaysSinceBeneficiaryExchange,
    discussionWith7DaysSinceBeneficiaryExchange,
    discussionWith7DaysSinceBeneficiaryExchangeWithContactModePhone,
    discussionWith8DaysSinceBeneficiaryExchange,
    discussionWith3DaysSinceBeneficiaryExchangeKind1E1S,
  ] = (
    [
      { date: subDays(now, 2), contactMode: "EMAIL", kind: "IF" },
      { date: subDays(now, 3), contactMode: "EMAIL", kind: "IF" },
      { date: subDays(now, 3), contactMode: "PHONE", kind: "IF" },
      { date: subDays(now, 4), contactMode: "EMAIL", kind: "IF" },
      { date: subDays(now, 6), contactMode: "EMAIL", kind: "IF" },
      { date: subDays(now, 7), contactMode: "EMAIL", kind: "IF" },
      { date: subDays(now, 7), contactMode: "PHONE", kind: "IF" },
      { date: subDays(now, 8), contactMode: "EMAIL", kind: "IF" },
      {
        date: subDays(now, 3),
        contactMode: "EMAIL",
        kind: "1_ELEVE_1_STAGE",
      },
    ] satisfies {
      date: Date;
      contactMode: ContactMode;
      kind: DiscussionKind;
    }[]
  ).map(({ date, contactMode }, index) => {
    const builder = new DiscussionBuilder()
      .withId(uuid())
      .withEstablishmentContact({
        email: `test-${index}@email.com`,
        firstName: `test-${index}`,
        lastName: `test-${index}`,
        phone: "0677889944",
      })
      .withContactMode(contactMode)
      .withPotentialBeneficiaryEmail(`benef-${index}@email.com`)
      .withPotentialBeneficiaryFirstname(`mike-${index}`)
      .withPotentialBeneficiaryLastName(`portnoy-${index}`)
      .withExchanges([
        {
          sender: "potentialBeneficiary",
          recipient: "establishment",
          subject: "This is a contact request",
          message: "Beneficiary message",
          sentAt: date.toISOString(),
          attachments: [],
        },
      ])
      .withCreatedAt(date);

    if (contactMode === "EMAIL")
      builder.withPotentialBeneficiaryPhone("0677889944");

    return builder.build();
  });

  let contactRequestReminder: ContactRequestReminder;
  let uow: InMemoryUnitOfWork;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    timeGateway = new CustomTimeGateway(now);
    const uuidGenerator = new TestUuidGenerator();
    uuidGenerator.setNextUuids(["1", "2", "3", "4"]);

    uow = createInMemoryUow();
    contactRequestReminder = makeContactRequestReminder({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        domain,
        saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
          uuidGenerator,
          timeGateway,
        ),
        timeGateway,
      },
    });
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    uow.establishmentAggregateRepository.establishmentAggregates = [
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(
          discussionWith2DaysSinceBeneficiaryExchange.siret,
        )
        .withUserRights([
          {
            role: "establishment-admin",
            job: "",
            phone: "",
            userId: "osef",
            shouldReceiveDiscussionNotifications: true,
          },
        ])
        .build(),
    ];
  });

  describe("does not send a reminder", () => {
    it("when establishment is not in repository anymore", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [];
      uow.discussionRepository.discussions = [
        discussionWith3DaysSinceBeneficiaryExchange,
      ];

      const reminderQty = await contactRequestReminder.execute(
        "3days",
        undefined,
      );

      expectToEqual(reminderQty, { numberOfNotifications: 0 });
      expectSavedNotificationsAndEvents({
        emails: [],
      });
    });

    it("when no discussion with missing establishment response since 3 or 7 days", async () => {
      uow.discussionRepository.discussions = [
        discussionWith2DaysSinceBeneficiaryExchange,
        discussionWith6DaysSinceBeneficiaryExchange,
      ];
      const reminderQty3d = await contactRequestReminder.execute(
        "3days",
        undefined,
      );
      const reminderQty7d = await contactRequestReminder.execute(
        "7days",
        undefined,
      );
      expectToEqual(reminderQty3d, { numberOfNotifications: 0 });
      expectToEqual(reminderQty7d, { numberOfNotifications: 0 });
      expectToEqual(uow.outboxRepository.events, []);
    });

    it("when no discussion when establishment already answered", async () => {
      timeGateway.setNextDate(new Date("2024-08-08 10:15:00"));
      uow.discussionRepository.discussions = [
        new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-07-01 09:19:35"))
          .withStatus({ status: "PENDING" })
          .withExchanges([
            {
              sender: "potentialBeneficiary",
              recipient: "establishment",
              sentAt: new Date("2024-07-01 09:19:35").toISOString(),
              attachments: [],
              message: "",
              subject: "",
            },
            {
              sender: "establishment",
              recipient: "potentialBeneficiary",
              sentAt: new Date("2024-07-23 15:34:15").toISOString(),
              attachments: [],
              message: "",
              subject: "",
            },
            {
              sender: "potentialBeneficiary",
              recipient: "establishment",
              sentAt: new Date("2024-07-25 09:25:17").toISOString(),
              attachments: [],
              message: "",
              subject: "",
            },
            {
              sender: "establishment",
              recipient: "potentialBeneficiary",
              sentAt: new Date("2024-07-31 08:55:47").toISOString(),
              attachments: [],
              message: "",
              subject: "",
            },
          ])
          .build(),
        new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-07-26 06:48:59"))
          .withStatus({ status: "PENDING" })
          .withExchanges([
            {
              sender: "potentialBeneficiary",
              recipient: "establishment",
              sentAt: new Date("2024-07-26 06:48:59").toISOString(),
              attachments: [],
              message: "",
              subject: "",
            },
            {
              sender: "establishment",
              recipient: "potentialBeneficiary",
              sentAt: new Date("2024-07-26 07:24:36").toISOString(),
              attachments: [],
              message: "",
              subject: "",
            },
            {
              sender: "establishment",
              recipient: "potentialBeneficiary",
              sentAt: new Date("2024-07-29 10:13:46").toISOString(),
              attachments: [],
              message: "",
              subject: "",
            },
            {
              sender: "potentialBeneficiary",
              recipient: "establishment",
              sentAt: new Date("2024-07-29 14:12:26").toISOString(),
              attachments: [],
              message: "",
              subject: "",
            },
          ])
          .build(),
      ];
      const reminderQty3d = await contactRequestReminder.execute(
        "3days",
        undefined,
      );
      const reminderQty7d = await contactRequestReminder.execute(
        "7days",
        undefined,
      );

      expectToEqual(uow.notificationRepository.notifications, []);
      expectToEqual(uow.outboxRepository.events, []);
      expectToEqual(reminderQty3d, { numberOfNotifications: 0 });
      expectToEqual(reminderQty7d, { numberOfNotifications: 0 });
    });

    it("when no discussion with status other than PENDING", async () => {
      uow.discussionRepository.discussions = [
        new DiscussionBuilder(discussionWith3DaysSinceBeneficiaryExchange)
          .withStatus({ status: "ACCEPTED", candidateWarnedMethod: null })
          .build(),
        new DiscussionBuilder(discussionWith4DaysSinceBeneficiaryExchange)
          .withStatus({
            status: "REJECTED",
            rejectionKind: "UNABLE_TO_HELP",
          })
          .build(),
        new DiscussionBuilder(discussionWith7DaysSinceBeneficiaryExchange)
          .withStatus({ status: "ACCEPTED", candidateWarnedMethod: null })
          .build(),
        new DiscussionBuilder(discussionWith8DaysSinceBeneficiaryExchange)
          .withStatus({
            status: "REJECTED",
            rejectionKind: "UNABLE_TO_HELP",
          })
          .build(),
      ];
      const reminderQty3d = await contactRequestReminder.execute(
        "3days",
        undefined,
      );
      const reminderQty7d = await contactRequestReminder.execute(
        "7days",
        undefined,
      );
      expectToEqual(reminderQty3d, { numberOfNotifications: 0 });
      expectToEqual(reminderQty7d, { numberOfNotifications: 0 });
      expectToEqual(uow.outboxRepository.events, []);
    });
  });

  describe("send reminder notification", () => {
    beforeEach(() => {
      uow.discussionRepository.discussions = [
        discussionWith2DaysSinceBeneficiaryExchange,
        discussionWith3DaysSinceBeneficiaryExchange,
        discussionWith3DaysSinceBeneficiaryExchangeWithContactModePhone,
        discussionWith4DaysSinceBeneficiaryExchange,
        discussionWith6DaysSinceBeneficiaryExchange,
        discussionWith7DaysSinceBeneficiaryExchange,
        discussionWith7DaysSinceBeneficiaryExchangeWithContactModePhone,
        discussionWith8DaysSinceBeneficiaryExchange,
        discussionWith3DaysSinceBeneficiaryExchangeKind1E1S,
      ];
    });

    it("when discussion with missing establishment response 3 days after ", async () => {
      const reminderQty = await contactRequestReminder.execute(
        "3days",
        undefined,
      );

      expectToEqual(reminderQty, { numberOfNotifications: 3 });
      expectSavedNotificationsAndEvents({
        emails: [
          makeEstablishmentContactRequestReminder(
            discussionWith3DaysSinceBeneficiaryExchange,
            domain,
            "3days",
          ),
          makeEstablishmentContactRequestReminder(
            discussionWith4DaysSinceBeneficiaryExchange,
            domain,
            "3days",
          ),
          makeEstablishmentContactRequestReminder(
            discussionWith3DaysSinceBeneficiaryExchangeKind1E1S,
            domain,
            "3days",
          ),
        ],
      });
    });

    it("when discussion with missing establishment response 7 days after ", async () => {
      const reminderQty = await contactRequestReminder.execute(
        "7days",
        undefined,
      );

      expectToEqual(reminderQty, { numberOfNotifications: 2 });
      expectSavedNotificationsAndEvents({
        emails: [
          makeEstablishmentContactRequestReminder(
            discussionWith7DaysSinceBeneficiaryExchange,
            domain,
            "7days",
          ),
          makeEstablishmentContactRequestReminder(
            discussionWith8DaysSinceBeneficiaryExchange,
            domain,
            "7days",
          ),
        ],
      });
    });
  });
});

const makeEstablishmentContactRequestReminder = (
  discussion: DiscussionDto,
  domain: string,
  mode: ContactRequestReminderMode,
): TemplatedEmail => {
  const replyEmail = createOpaqueEmail({
    discussionId: discussion.id,
    recipient: {
      kind: "potentialBeneficiary",
      firstname: getFormattedFirstnameAndLastname({
        firstname: discussion.potentialBeneficiary.firstName,
      }),
      lastname: getFormattedFirstnameAndLastname({
        lastname: discussion.potentialBeneficiary.lastName,
      }),
    },
    replyDomain: `reply.${domain}`,
  });
  return {
    kind: "ESTABLISHMENT_CONTACT_REQUEST_REMINDER",
    params: {
      appellationLabel: cartographeAppellationAndRome.appellationLabel,
      beneficiaryFirstName: getFormattedFirstnameAndLastname({
        firstname: discussion.potentialBeneficiary.firstName,
      }),
      beneficiaryLastName: getFormattedFirstnameAndLastname({
        lastname: discussion.potentialBeneficiary.lastName,
      }),
      beneficiaryReplyToEmail: replyEmail,
      domain,
      mode,
    },
    recipients: [discussion.establishmentContact.email],
    sender: immersionFacileNoReplyEmailSender,
    replyTo: {
      email: replyEmail,
      name: getFormattedFirstnameAndLastname({
        firstname: discussion.potentialBeneficiary.firstName,
        lastname: discussion.potentialBeneficiary.lastName,
      }),
    },
  };
};
