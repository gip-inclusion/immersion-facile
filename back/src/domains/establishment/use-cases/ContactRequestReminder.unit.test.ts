import { addDays } from "date-fns";
import {
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
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  ContactRequestReminder,
  ContactRequestReminderMode,
} from "./ContactRequestReminder";

describe("ContactRequestReminder", () => {
  const now = new Date();
  const replyDomain = "@replydomain.fr";
  const [
    discussionWith2DaysSinceBeneficiairyExchange,
    discussionWith3DaysSinceBeneficiairyExchange,
    discussionWith4DaysSinceBeneficiairyExchange,
    discussionWith6DaysSinceBeneficiairyExchange,
    discussionWith7DaysSinceBeneficiairyExchange,
    discussionWith8DaysSinceBeneficiairyExchange,
  ] = [
    addDays(now, -2),
    addDays(now, -3),
    addDays(now, -4),
    addDays(now, -6),
    addDays(now, -7),
    addDays(now, -8),
  ].map((date, index) =>
    new DiscussionBuilder()
      .withId(uuid())
      .withPotentialBeneficiary({
        email: `benef-${index}@email.com`,
        firstName: `mike-${index}`,
        lastName: `porknoy-${index}`,
        phone: "0677889944",
      })
      .withExchanges([
        {
          sender: "potentialBeneficiary",
          recipient: "establishment",
          subject: "This is a contact request",
          message: "Beneficiary message",
          sentAt: date.toISOString(),
        },
      ])
      .build(),
  );

  let contactRequestReminder: ContactRequestReminder;
  let uowPerformer: UnitOfWorkPerformer;
  let uuidGenerator: TestUuidGenerator;
  let timeGateway: CustomTimeGateway;
  let uow: InMemoryUnitOfWork;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    uowPerformer = new InMemoryUowPerformer(uow);
    timeGateway = new CustomTimeGateway(now);
    uuidGenerator = new TestUuidGenerator();

    uuidGenerator.setNextUuids(["1", "2"]);

    contactRequestReminder = new ContactRequestReminder(
      uowPerformer,
      makeSaveNotificationAndRelatedEvent(uuidGenerator, timeGateway),
      timeGateway,
      replyDomain,
    );
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
  });

  describe("wrong paths", () => {
    it("no discussion with missing establishment response since 3 or 7 days", async () => {
      uow.discussionRepository.discussions = [
        discussionWith2DaysSinceBeneficiairyExchange,
        discussionWith6DaysSinceBeneficiairyExchange,
      ];
      await contactRequestReminder.execute("3days");
      await contactRequestReminder.execute("7days");
      expectToEqual(uow.outboxRepository.events, []);
    });
  });

  describe("right paths", () => {
    it("when discussion with missing establishment response 3 days after ", async () => {
      uow.discussionRepository.discussions = [
        discussionWith2DaysSinceBeneficiairyExchange,
        discussionWith3DaysSinceBeneficiairyExchange,
        discussionWith4DaysSinceBeneficiairyExchange,
        discussionWith6DaysSinceBeneficiairyExchange,
        discussionWith7DaysSinceBeneficiairyExchange,
        discussionWith8DaysSinceBeneficiairyExchange,
      ];
      await contactRequestReminder.execute("3days");

      expectSavedNotificationsAndEvents({
        emails: [
          makeEstablishmentContactRequestReminder(
            discussionWith3DaysSinceBeneficiairyExchange,
            replyDomain,
            "3days",
          ),
          makeEstablishmentContactRequestReminder(
            discussionWith4DaysSinceBeneficiairyExchange,
            replyDomain,
            "3days",
          ),
        ],
      });
    });

    it("when discussion with missing establishment response 7 days after ", async () => {
      uow.discussionRepository.discussions = [
        discussionWith2DaysSinceBeneficiairyExchange,
        discussionWith3DaysSinceBeneficiairyExchange,
        discussionWith4DaysSinceBeneficiairyExchange,
        discussionWith6DaysSinceBeneficiairyExchange,
        discussionWith7DaysSinceBeneficiairyExchange,
        discussionWith8DaysSinceBeneficiairyExchange,
      ];

      await contactRequestReminder.execute("7days");

      expectSavedNotificationsAndEvents({
        emails: [
          makeEstablishmentContactRequestReminder(
            discussionWith7DaysSinceBeneficiairyExchange,
            replyDomain,
            "7days",
          ),
          makeEstablishmentContactRequestReminder(
            discussionWith8DaysSinceBeneficiairyExchange,
            replyDomain,
            "7days",
          ),
        ],
      });
    });
  });
});

const makeEstablishmentContactRequestReminder = (
  discussion: DiscussionDto,
  replyDomain: string,
  mode: ContactRequestReminderMode,
): TemplatedEmail => {
  const replyEmail1 = createOpaqueEmail(
    discussion.id,
    "potentialBeneficiary",
    replyDomain,
  );
  return {
    kind: "ESTABLISHMENT_CONTACT_REQUEST_REMINDER",
    params: {
      appelationLabel: cartographeAppellationAndRome.appellationLabel,
      beneficiaryFirstName: discussion.potentialBeneficiary.firstName,
      beneficiaryLastName: discussion.potentialBeneficiary.lastName,
      beneficiaryReplyToEmail: replyEmail1,
      mode,
    },
    recipients: [discussion.establishmentContact.email],
    sender: immersionFacileNoReplyEmailSender,
    replyTo: {
      email: replyEmail1,
      name: `${discussion.potentialBeneficiary.firstName} ${discussion.potentialBeneficiary.lastName}`,
    },
  };
};
