import { TemplatedEmail, TemplatedSms } from "shared";
import { InMemoryNotificationGateway } from "../../../../adapters/secondary/notificationGateway/InMemoryNotificationGateway";
import { SendNotification } from "./SendNotification";

describe("SendNotification UseCase", () => {
  let notificationGateway: InMemoryNotificationGateway;
  let sendNotification: SendNotification;

  beforeEach(() => {
    notificationGateway = new InMemoryNotificationGateway();
    sendNotification = new SendNotification(notificationGateway);
  });

  it("should send an email", async () => {
    const email: TemplatedEmail = {
      type: "AGENCY_WAS_ACTIVATED",
      params: { agencyName: "My agency", agencyLogoUrl: undefined },
      recipients: ["bob@mail.com"],
      cc: [],
    };

    await sendNotification.execute({ kind: "email", email });

    expect(notificationGateway.getSentEmails()).toEqual([email]);
  });

  it("should send an SMS", async () => {
    const sms: TemplatedSms = {
      kind: "FirstReminderForSignatories",
      params: { shortLink: "https://my-link.com" },
      recipient: "33612345678",
    };

    await sendNotification.execute({ kind: "sms", sms });

    expect(notificationGateway.getSentSms()).toEqual([sms]);
  });
});
