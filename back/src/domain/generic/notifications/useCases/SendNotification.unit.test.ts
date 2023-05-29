import { expectPromiseToFailWith, TemplatedEmail, TemplatedSms } from "shared";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import { InMemoryNotificationRepository } from "../../../../adapters/secondary/InMemoryNotificationRepository";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryNotificationGateway } from "../../../../adapters/secondary/notificationGateway/InMemoryNotificationGateway";
import { SendNotification } from "./SendNotification";

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

  it("should throw if notification not found", async () => {
    const id = "notif-404";
    const kind = "email";
    await expectPromiseToFailWith(
      sendNotification.execute({ id, kind }),
      `Notification with id ${id} and kind ${kind} not found`,
    );
  });

  it("should send an email", async () => {
    const email: TemplatedEmail = {
      type: "AGENCY_WAS_ACTIVATED",
      params: { agencyName: "My agency", agencyLogoUrl: undefined },
      recipients: ["bob@mail.com"],
      cc: [],
    };

    const id = "notif-123";
    notificationRepository.notifications = [
      {
        id,
        kind: "email",
        email,
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
        sms,
      },
    ];

    await sendNotification.execute({ id: "notif-abc", kind: "sms" });

    expect(notificationGateway.getSentSms()).toEqual([sms]);
  });
});
