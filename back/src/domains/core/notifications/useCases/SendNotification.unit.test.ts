import {
  type TemplatedEmail,
  type TemplatedSms,
  errors,
  expectPromiseToFailWithError,
} from "shared";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../unit-of-work/adapters/createInMemoryUow";
import {
  InMemoryNotificationGateway,
  sendSmsErrorPhoneNumber,
} from "../adapters/InMemoryNotificationGateway";
import type { InMemoryNotificationRepository } from "../adapters/InMemoryNotificationRepository";
import { SendNotification } from "./SendNotification";

const someDate = new Date("2023-01-01").toISOString();

describe("SendNotification UseCase", () => {
  let notificationGateway: InMemoryNotificationGateway;
  let notificationRepository: InMemoryNotificationRepository;
  let sendNotification: SendNotification;

  beforeEach(() => {
    notificationGateway = new InMemoryNotificationGateway();
    const uow = createInMemoryUow();
    notificationRepository = uow.notificationRepository;
    const uowPerformer = new InMemoryUowPerformer(uow);
    sendNotification = new SendNotification(uowPerformer, notificationGateway);
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

    it("when error occurres in SMS sending", async () => {
      const id = "notif-abc";

      notificationRepository.notifications = [
        {
          id,
          kind: "sms",
          templatedContent: {
            kind: "FirstReminderForSignatories",
            params: { shortLink: "https://my-link.com" },
            recipientPhone: `33${sendSmsErrorPhoneNumber.substring(1)}`,
          },
          createdAt: someDate,
          followedIds: { conventionId: "convention-123" },
        },
      ];

      await expectPromiseToFailWithError(
        sendNotification.execute({ id, kind: "sms" }),
        new Error("Send SMS Error with phone number 33699999999."),
      );
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
    notificationRepository.notifications = [
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
    notificationRepository.notifications = [
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
