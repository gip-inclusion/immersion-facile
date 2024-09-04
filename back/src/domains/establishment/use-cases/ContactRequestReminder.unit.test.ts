import { subDays } from "date-fns";
import {
  ContactMethod,
  DiscussionBuilder,
  DiscussionDto,
  TemplatedEmail,
  cartographeAppellationAndRome,
  createOpaqueEmail,
  expectToEqual,
  immersionFacileNoReplyEmailSender,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  ContactRequestReminder,
  ContactRequestReminderMode,
  makeContactRequestReminder,
} from "./ContactRequestReminder";

describe("ContactRequestReminder", () => {
  let timeGateway: CustomTimeGateway;
  const now = new Date();
  const domain = "domain.fr";

  const [
    discussionWith2DaysSinceBeneficiaryExchange,
    discussionWith3DaysSinceBeneficiaryExchange,
    discussionWith3DaysSinceBeneficiaryExchangeWithContactMethodPhone,
    discussionWith4DaysSinceBeneficiaryExchange,
    discussionWith6DaysSinceBeneficiaryExchange,
    discussionWith7DaysSinceBeneficiaryExchange,
    discussionWith7DaysSinceBeneficiaryExchangeWithContactMethodPhone,
    discussionWith8DaysSinceBeneficiaryExchange,
  ] = (
    [
      { date: subDays(now, 2), contactMethod: "EMAIL" },
      { date: subDays(now, 3), contactMethod: "EMAIL" },
      { date: subDays(now, 3), contactMethod: "PHONE" },
      { date: subDays(now, 4), contactMethod: "EMAIL" },
      { date: subDays(now, 6), contactMethod: "EMAIL" },
      { date: subDays(now, 7), contactMethod: "EMAIL" },
      { date: subDays(now, 7), contactMethod: "PHONE" },
      { date: subDays(now, 8), contactMethod: "EMAIL" },
    ] satisfies {
      date: Date;
      contactMethod: ContactMethod;
    }[]
  ).map(({ date, contactMethod }, index) =>
    new DiscussionBuilder()
      .withId(uuid())
      .withEstablishmentContact({
        contactMethod,
        email: `test-${index}@email.com`,
        firstName: `test-${index}`,
        lastName: `test-${index}`,
        phone: "0677889944",
      })
      .withPotentialBeneficiary({
        email: `benef-${index}@email.com`,
        firstName: `mike-${index}`,
        lastName: `portnoy-${index}`,
        phone: "0677889944",
      })
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
      .withCreatedAt(date)
      .build(),
  );

  let contactRequestReminder: ContactRequestReminder;
  let uow: InMemoryUnitOfWork;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    timeGateway = new CustomTimeGateway(now);
    const uuidGenerator = new TestUuidGenerator();
    uuidGenerator.setNextUuids(["1", "2"]);

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
  });

  describe("wrong paths", () => {
    it("no discussion with missing establishment response since 3 or 7 days", async () => {
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

    it("no discussion when establishment already answered", async () => {
      timeGateway.setNextDate(new Date("2024-08-08 10:15:00"));
      uow.discussionRepository.discussions = [
        new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-07-01 09:19:35"))
          .withStatus("PENDING")
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
          .withStatus("PENDING")
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

    it("no discussion with status other than PENDING", async () => {
      uow.discussionRepository.discussions = [
        new DiscussionBuilder(discussionWith3DaysSinceBeneficiaryExchange)
          .withStatus("ACCEPTED")
          .build(),
        new DiscussionBuilder(discussionWith4DaysSinceBeneficiaryExchange)
          .withStatus("REJECTED")
          .build(),
        new DiscussionBuilder(discussionWith7DaysSinceBeneficiaryExchange)
          .withStatus("ACCEPTED")
          .build(),
        new DiscussionBuilder(discussionWith8DaysSinceBeneficiaryExchange)
          .withStatus("REJECTED")
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

  describe("right paths", () => {
    beforeEach(() => {
      uow.discussionRepository.discussions = [
        discussionWith2DaysSinceBeneficiaryExchange,
        discussionWith3DaysSinceBeneficiaryExchange,
        discussionWith3DaysSinceBeneficiaryExchangeWithContactMethodPhone,
        discussionWith4DaysSinceBeneficiaryExchange,
        discussionWith6DaysSinceBeneficiaryExchange,
        discussionWith7DaysSinceBeneficiaryExchange,
        discussionWith7DaysSinceBeneficiaryExchangeWithContactMethodPhone,
        discussionWith8DaysSinceBeneficiaryExchange,
      ];
    });

    it("when discussion with missing establishment response 3 days after ", async () => {
      const reminderQty = await contactRequestReminder.execute(
        "3days",
        undefined,
      );

      expectToEqual(reminderQty, { numberOfNotifications: 2 });
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
  const replyEmail = createOpaqueEmail(
    discussion.id,
    "potentialBeneficiary",
    `reply.${domain}`,
  );
  return {
    kind: "ESTABLISHMENT_CONTACT_REQUEST_REMINDER",
    params: {
      appellationLabel: cartographeAppellationAndRome.appellationLabel,
      beneficiaryFirstName: discussion.potentialBeneficiary.firstName,
      beneficiaryLastName: discussion.potentialBeneficiary.lastName,
      beneficiaryReplyToEmail: replyEmail,
      domain,
      mode,
    },
    recipients: [discussion.establishmentContact.email],
    sender: immersionFacileNoReplyEmailSender,
    replyTo: {
      email: replyEmail,
      name: `${discussion.potentialBeneficiary.firstName} ${discussion.potentialBeneficiary.lastName}`,
    },
  };
};
