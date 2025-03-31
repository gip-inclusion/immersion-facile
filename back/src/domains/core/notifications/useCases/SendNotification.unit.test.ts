import {
  type EmailNotification,
  type NotificationErrored,
  type SmsNotification,
  type TemplatedEmail,
  type TemplatedSms,
  errors,
  expectArraysToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  type CreateNewEvent,
  makeCreateNewEvent,
} from "../../events/ports/EventBus";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  InMemoryNotificationGateway,
  emailThatTriggerSendEmailError,
  fakeHttpStatusErrorCode,
  sendSmsErrorPhoneNumber,
} from "../adapters/InMemoryNotificationGateway";
import { SendNotification } from "./SendNotification";

const someDate = new Date("2023-01-01").toISOString();

describe("SendNotification UseCase", () => {
  let notificationGateway: InMemoryNotificationGateway;
  let sendNotification: SendNotification;
  let timeGateway: CustomTimeGateway;
  let createNewEvent: CreateNewEvent;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    notificationGateway = new InMemoryNotificationGateway();
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    const uuidGenerator = new TestUuidGenerator();
    timeGateway = new CustomTimeGateway();
    createNewEvent = makeCreateNewEvent({
      timeGateway: timeGateway,
      uuidGenerator: uuidGenerator,
    });
    sendNotification = new SendNotification(
      uowPerformer,
      notificationGateway,
      timeGateway,
      createNewEvent,
    );
  });

  describe("Wrong paths", () => {
    it("should throw if notification not found", async () => {
      const id = "notif-404";
      const kind = "email";
      await expectPromiseToFailWithError(
        sendNotification.execute({ id, kind }),
        errors.notification.notFound({ id, kind }),
      );
    });

    describe("when error occurres in SMS or email sending", () => {
      it("should return the error, store it in the notification (and not send any event)", async () => {
        const id = "notif-sms-id";

        const now = new Date();
        timeGateway.setNextDate(now);

        const smsNotification: SmsNotification = {
          id,
          kind: "sms",
          templatedContent: {
            kind: "FirstReminderForSignatories",
            params: { shortLink: "https://my-link.com" },
            recipientPhone: `33${sendSmsErrorPhoneNumber.substring(1)}`,
          },
          createdAt: someDate,
          followedIds: { conventionId: "convention-123" },
        };

        uow.notificationRepository.notifications = [smsNotification];

        const errorMessage =
          "fake Send SMS Error with phone number 33699999999.";

        await expectPromiseToFailWithError(
          sendNotification.execute({ id, kind: "sms" }),
          new Error(errorMessage),
        );

        const notificationState: NotificationErrored = {
          status: "errored",
          occurredAt: now.toISOString(),
          httpStatus: fakeHttpStatusErrorCode,
          message: errorMessage,
        };

        expectToEqual(uow.notificationRepository.notifications, [
          {
            ...smsNotification,
            state: notificationState,
          },
        ]);
      });

      describe("when the notification is a DISCUSSION_EXCHANGE", () => {
        const emailNotification: EmailNotification = {
          id: "notif-email-id-that-throws",
          kind: "email",
          templatedContent: {
            kind: "DISCUSSION_EXCHANGE",
            params: {} as any,
            recipients: [emailThatTriggerSendEmailError],
          },
          createdAt: someDate,
          followedIds: {},
        };

        it("should dispatch an event when it was a discussion exchange notification failed to deliver", async () => {
          uow.notificationRepository.notifications = [emailNotification];

          const now = new Date();
          timeGateway.setNextDate(now);

          const notificationState: NotificationErrored = {
            status: "errored",
            occurredAt: now.toISOString(),
            httpStatus: fakeHttpStatusErrorCode,
            message:
              "fake Send Email Error with email email-that-triggers-send-email-error@mail.com",
          };

          await expectPromiseToFailWithError(
            sendNotification.execute({
              id: emailNotification.id,
              kind: "email",
            }),
            new Error(notificationState.message),
          );

          expectArraysToMatch(uow.outboxRepository.events, [
            {
              topic: "DiscussionExchangeDeliveryFailed",
              payload: {
                notificationId: emailNotification.id,
                notificationKind: emailNotification.kind,
                errored: notificationState,
              },
            },
          ]);
        });

        it("does not trigger the event, if the notification was already errored, but it should update the notification", async () => {
          const alreadyErroredEmailNotif: EmailNotification = {
            ...emailNotification,
            state: {
              status: "errored",
              occurredAt: new Date().toISOString(),
              httpStatus: 404,
              message: "some error",
            },
          };

          uow.notificationRepository.notifications = [alreadyErroredEmailNotif];

          const now = new Date();
          timeGateway.setNextDate(now);

          const notificationState: NotificationErrored = {
            status: "errored",
            occurredAt: now.toISOString(),
            httpStatus: fakeHttpStatusErrorCode,
            message:
              "fake Send Email Error with email email-that-triggers-send-email-error@mail.com",
          };

          await expectPromiseToFailWithError(
            sendNotification.execute({
              id: emailNotification.id,
              kind: "email",
            }),
            new Error(notificationState.message),
          );

          expectArraysToMatch(uow.notificationRepository.notifications, [
            { ...alreadyErroredEmailNotif, state: notificationState },
          ]);

          expectArraysToMatch(uow.outboxRepository.events, []);
        });

        it("does not trigger the event, if the notification was already errored, but it should update the notification event when it is finally successful", async () => {
          const alreadyErroredEmailNotif: EmailNotification = {
            ...emailNotification,
            templatedContent: {
              ...emailNotification.templatedContent,
              recipients: ["does-not-error@mail.com"],
            },
            state: {
              status: "errored",
              occurredAt: new Date().toISOString(),
              httpStatus: 404,
              message: "some error",
            },
          };

          uow.notificationRepository.notifications = [alreadyErroredEmailNotif];

          const now = new Date();
          timeGateway.setNextDate(now);

          await sendNotification.execute({
            id: emailNotification.id,
            kind: "email",
          });

          expectArraysToMatch(uow.notificationRepository.notifications, [
            { ...alreadyErroredEmailNotif, state: undefined },
          ]);

          expectArraysToMatch(uow.outboxRepository.events, []);
        });
      });
    });
  });

  it("should send an email", async () => {
    const email: TemplatedEmail = {
      kind: "AGENCY_WAS_ACTIVATED",
      params: {
        agencyName: "My agency",
        agencyLogoUrl: undefined,
        refersToOtherAgency: false,
        agencyReferdToName: undefined,
        users: [
          {
            firstName: "Jean",
            lastName: "Dupont",
            email: "jean-dupont@gmail.com",
            agencyName: "Agence du Grand Est",
            isNotifiedByEmail: true,
            roles: ["validator"],
          },

          {
            firstName: "Jeanne",
            lastName: "Dupont",
            email: "jeanne-dupont@gmail.com",
            agencyName: "Agence du Grand Est",
            isNotifiedByEmail: true,
            roles: ["counsellor"],
          },
        ],
      },
      recipients: ["bob@mail.com"],
      cc: [],
      replyTo: {
        email: "yolo@mail.com",
        name: "Yolo",
      },
    };

    const id = "notif-123";
    uow.notificationRepository.notifications = [
      {
        id,
        kind: "email",
        templatedContent: email,
        createdAt: someDate,
        followedIds: { agencyId: "agency-123" },
      },
    ];

    await sendNotification.execute({ id, kind: "email" });

    expect(notificationGateway.getSentEmails()).toEqual([email]);
  });

  it("should send an SMS", async () => {
    const sms: TemplatedSms = {
      kind: "FirstReminderForSignatories",
      params: { shortLink: "https://my-link.com" },
      recipientPhone: "33612345678",
    };

    const id = "notif-abc";
    uow.notificationRepository.notifications = [
      {
        id,
        kind: "sms",
        templatedContent: sms,
        createdAt: someDate,
        followedIds: { conventionId: "convention-123" },
      },
    ];

    await sendNotification.execute({ id, kind: "sms" });

    expect(notificationGateway.getSentSms()).toEqual([sms]);
  });
});
