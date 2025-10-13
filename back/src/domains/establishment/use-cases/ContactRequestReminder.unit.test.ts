import { subDays } from "date-fns";
import {
  ConnectedUserBuilder,
  type ContactMode,
  cartographeAppellationAndRome,
  createOpaqueEmail,
  DiscussionBuilder,
  type DiscussionDto,
  type DiscussionKind,
  type Email,
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
  const now = new Date();
  const domain = "domain.fr";

  const establishmentAdmin = new ConnectedUserBuilder()
    .withId(uuid())
    .withEmail("admin@mail.com")
    .build();
  const establishmentContact = new ConnectedUserBuilder()
    .withId(uuid())
    .withEmail("contact@mail.com")
    .build();

  const establishment = new EstablishmentAggregateBuilder()
    .withUserRights([
      {
        role: "establishment-admin",
        userId: establishmentAdmin.id,
        job: "boss",
        phone: "0677889944",
        shouldReceiveDiscussionNotifications: true,
        isMainContactByPhone: false,
      },
      {
        role: "establishment-contact",
        userId: establishmentContact.id,
        shouldReceiveDiscussionNotifications: true,
      },
      {
        role: "establishment-contact",
        userId: "not-notified-user-id",
        shouldReceiveDiscussionNotifications: false,
      },
    ])
    .build();

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
      .withSiret(establishment.establishment.siret)
      .withContactMode(contactMode)
      .withPotentialBeneficiaryEmail(`benef-${index}@email.com`)
      .withPotentialBeneficiaryFirstname(`mike-${index}`)
      .withPotentialBeneficiaryLastName(`portnoy-${index}`)
      .withExchanges([
        {
          sender: "potentialBeneficiary",
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
    const timeGateway = new CustomTimeGateway(now);
    const uuidGenerator = new TestUuidGenerator();

    uow = createInMemoryUow();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    uuidGenerator.setNextUuids(["1", "2", "3", "4"]);

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

    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishment,
    ];
    uow.userRepository.users = [establishmentAdmin, establishmentContact];
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
      uow.discussionRepository.discussions = [
        new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(subDays(now, 30))
          .withStatus({ status: "PENDING" })
          .withExchanges([
            {
              sender: "potentialBeneficiary",
              sentAt: subDays(now, 30).toISOString(),
              attachments: [],
              message: "",
              subject: "",
            },
            {
              sender: "establishment",
              email: establishmentAdmin.email,
              firstname: establishmentAdmin.firstName,
              lastname: establishmentAdmin.lastName,
              sentAt: subDays(now, 10).toISOString(),
              attachments: [],
              message: "",
              subject: "",
            },
            {
              sender: "potentialBeneficiary",
              sentAt: subDays(now, 9).toISOString(),
              attachments: [],
              message: "",
              subject: "",
            },
            {
              sender: "establishment",
              email: establishmentAdmin.email,
              firstname: establishmentAdmin.firstName,
              lastname: establishmentAdmin.lastName,
              sentAt: subDays(now, 8).toISOString(),
              attachments: [],
              message: "",
              subject: "",
            },
          ])
          .build(),
        new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(subDays(now, 10))
          .withStatus({ status: "PENDING" })
          .withExchanges([
            {
              sender: "potentialBeneficiary",
              sentAt: subDays(now, 10).toISOString(),
              attachments: [],
              message: "",
              subject: "",
            },
            {
              sender: "establishment",
              email: establishmentAdmin.email,
              firstname: establishmentAdmin.firstName,
              lastname: establishmentAdmin.lastName,
              sentAt: subDays(now, 9).toISOString(),
              attachments: [],
              message: "",
              subject: "",
            },
            {
              sender: "establishment",
              email: establishmentAdmin.email,
              firstname: establishmentAdmin.firstName,
              lastname: establishmentAdmin.lastName,
              sentAt: subDays(now, 8).toISOString(),
              attachments: [],
              message: "",
              subject: "",
            },
            {
              sender: "potentialBeneficiary",
              sentAt: subDays(now, 7).toISOString(),
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

    it("when establishment does not have users to contact", async () => {
      const establishmentWithNoUsersToContact =
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("12345678901234")
          .withUserRights([
            {
              role: "establishment-admin",
              userId: establishmentAdmin.id,
              job: "boss",
              phone: "0677889944",
              shouldReceiveDiscussionNotifications: false,
              isMainContactByPhone: false,
            },
            {
              role: "establishment-contact",
              userId: establishmentContact.id,
              shouldReceiveDiscussionNotifications: false,
            },
          ])
          .build();
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentWithNoUsersToContact,
      ];
      uow.discussionRepository.discussions = [
        new DiscussionBuilder(discussionWith4DaysSinceBeneficiaryExchange)
          .withSiret(establishmentWithNoUsersToContact.establishment.siret)
          .build(),
      ];

      const reminderQty = await contactRequestReminder.execute(
        "3days",
        undefined,
      );

      expectToEqual(reminderQty, { numberOfNotifications: 0 });
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
          makeEstablishmentContactRequestReminder({
            discussion: discussionWith3DaysSinceBeneficiaryExchange,
            establishmentContactEmails: [
              establishmentAdmin.email,
              establishmentContact.email,
            ],
            domain,
            mode: "3days",
          }),
          makeEstablishmentContactRequestReminder({
            discussion: discussionWith4DaysSinceBeneficiaryExchange,
            establishmentContactEmails: [
              establishmentAdmin.email,
              establishmentContact.email,
            ],
            domain,
            mode: "3days",
          }),
          makeEstablishmentContactRequestReminder({
            discussion: discussionWith3DaysSinceBeneficiaryExchangeKind1E1S,
            establishmentContactEmails: [
              establishmentAdmin.email,
              establishmentContact.email,
            ],
            domain,
            mode: "3days",
          }),
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
          makeEstablishmentContactRequestReminder({
            discussion: discussionWith7DaysSinceBeneficiaryExchange,
            establishmentContactEmails: [
              establishmentAdmin.email,
              establishmentContact.email,
            ],
            domain,
            mode: "7days",
          }),
          makeEstablishmentContactRequestReminder({
            discussion: discussionWith8DaysSinceBeneficiaryExchange,
            establishmentContactEmails: [
              establishmentAdmin.email,
              establishmentContact.email,
            ],
            domain,
            mode: "7days",
          }),
        ],
      });
    });
  });
});

const makeEstablishmentContactRequestReminder = ({
  discussion,
  establishmentContactEmails,
  domain,
  mode,
}: {
  discussion: DiscussionDto;
  establishmentContactEmails: Email[];
  domain: string;
  mode: ContactRequestReminderMode;
}): TemplatedEmail => {
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
    recipients: establishmentContactEmails,
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
