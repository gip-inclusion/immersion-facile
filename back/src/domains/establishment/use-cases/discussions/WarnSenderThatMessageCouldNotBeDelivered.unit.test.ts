import {
  errors,
  expectPromiseToFailWithError,
  type TemplatedEmail,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { makeWarnSenderThatMessageCouldNotBeDelivered } from "./WarnSenderThatMessageCouldNotBeDelivered";

describe("WarnSenderThatMessageCouldNotBeDelivered", () => {
  let useCase: ReturnType<typeof makeWarnSenderThatMessageCouldNotBeDelivered>;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let timeGateway: CustomTimeGateway;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    timeGateway = new CustomTimeGateway();
    const uuidGenerator = new UuidV4Generator();
    useCase = makeWarnSenderThatMessageCouldNotBeDelivered({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
          uuidGenerator,
          timeGateway,
        ),
      },
    });
  });

  describe("right paths", () => {
    it("sends warning email to sender when notification delivery failed", async () => {
      const notificationThatFailedId = uuid();
      const senderEmail = "sender@example.com";
      const recipients = ["recipient@example.com"];
      const errorMessage = "Failed to deliver";
      const httpStatus = 500;
      const occurredAt = new Date().toISOString();
      const createdAt = new Date().toISOString();

      const emailThatFailed: TemplatedEmail = {
        kind: "DISCUSSION_EXCHANGE",
        recipients,
        sender: {
          name: "Sender Name",
          email: senderEmail,
        },
        params: {
          sender: "establishment",
          subject: "Test Subject",
          htmlContent: "Test Content",
        },
      };

      uow.notificationRepository.notifications = [
        {
          id: notificationThatFailedId,
          kind: "email",
          createdAt,
          followedIds: {},
          templatedContent: emailThatFailed,
          state: {
            status: "errored",
            message: errorMessage,
            httpStatus,
            occurredAt,
          },
        },
      ];

      await uow.outboxRepository.save({
        id: "event-id",
        topic: "NotificationAdded",
        payload: { id: notificationThatFailedId, kind: "email" },
        occurredAt: new Date().toISOString(),
        publications: [],
        wasQuarantined: false,
        status: "never-published",
      });

      await useCase.execute({
        notificationId: notificationThatFailedId,
        notificationKind: "email",
        errored: {
          status: "errored",
          message: errorMessage,
          httpStatus,
          occurredAt,
        },
      });

      expectSavedNotificationsAndEvents({
        emails: [
          emailThatFailed,
          {
            kind: "WARN_DISCUSSION_DELIVERY_FAILED",
            params: {
              recipientsInEmailInError: recipients,
              errorMessage: `${errorMessage} (status: ${httpStatus})`,
            },
            recipients: [senderEmail],
          },
        ],
      });
    });
  });

  describe("wrong paths", () => {
    it("throws when notification is not found", async () => {
      const notificationId = uuid();
      const occurredAt = new Date().toISOString();

      await expectPromiseToFailWithError(
        useCase.execute({
          notificationId,
          notificationKind: "email",
          errored: {
            status: "errored",
            message: "error",
            httpStatus: 500,
            occurredAt,
          },
        }),
        errors.notification.notFound({
          kind: "email",
          id: notificationId,
        }),
      );
    });

    it("throws when notification is of kind sms", async () => {
      const notificationId = uuid();
      const occurredAt = new Date().toISOString();
      const createdAt = new Date().toISOString();

      uow.notificationRepository.notifications = [
        {
          id: notificationId,
          kind: "sms",
          createdAt,
          templatedContent: {
            kind: "HelloWorld",
            params: { testMessage: "yo" },
            recipientPhone: "0612345678",
          },
          followedIds: {},
          state: {
            status: "errored",
            message: "error",
            httpStatus: 500,
            occurredAt,
          },
        },
      ];

      await expectPromiseToFailWithError(
        useCase.execute({
          notificationId,
          notificationKind: "sms",
          errored: {
            status: "errored",
            message: "error",
            httpStatus: 500,
            occurredAt,
          },
        }),
        errors.notification.smsNotSupported(),
      );
    });

    it("throws when notification is not in errored state", async () => {
      const notificationId = uuid();
      const occurredAt = new Date().toISOString();
      const createdAt = new Date().toISOString();

      uow.notificationRepository.notifications = [
        {
          id: notificationId,
          kind: "email",
          createdAt,
          followedIds: {},
          templatedContent: {
            kind: "DISCUSSION_EXCHANGE",
            recipients: ["recipient@example.com"],
            sender: {
              name: "Sender Name",
              email: "sender@example.com",
            },
            params: {
              sender: "establishment",
              subject: "Test Subject",
              htmlContent: "Test Content",
            },
          },
          state: {
            status: "accepted",
            occurredAt,
            messageIds: [],
          },
        },
      ];

      await expectPromiseToFailWithError(
        useCase.execute({
          notificationId,
          notificationKind: "email",
          errored: {
            status: "errored",
            message: "error",
            httpStatus: 500,
            occurredAt,
          },
        }),
        errors.notification.doesNotNeedToBeWarned({ notificationId }),
      );
    });

    it("throws when notification has no sender email", async () => {
      const notificationId = uuid();
      const occurredAt = new Date().toISOString();
      const createdAt = new Date().toISOString();

      uow.notificationRepository.notifications = [
        {
          id: notificationId,
          kind: "email",
          createdAt,
          followedIds: {},
          templatedContent: {
            kind: "DISCUSSION_EXCHANGE",
            recipients: ["recipient@example.com"],
            sender: {
              name: "Sender Name",
              email: "",
            },
            params: {
              sender: "establishment",
              subject: "Test Subject",
              htmlContent: "Test Content",
            },
          },
          state: {
            status: "errored",
            message: "error",
            httpStatus: 500,
            occurredAt,
          },
        },
      ];

      await expectPromiseToFailWithError(
        useCase.execute({
          notificationId,
          notificationKind: "email",
          errored: {
            status: "errored",
            message: "error",
            httpStatus: 500,
            occurredAt,
          },
        }),
        errors.notification.noSenderEmail({ notificationId }),
      );
    });
  });
});
