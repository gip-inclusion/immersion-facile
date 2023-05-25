import { z } from "zod";
import { exhaustiveCheck, TemplatedEmail, templatedEmailSchema } from "shared";
import { NotificationGateway } from "../../../convention/ports/NotificationGateway";
import { UseCase } from "../../../core/UseCase";

type Sms = {
  content: string;
  sender: string;
  recipient: string;
};
const smsSchema: z.Schema<Sms> = z.object({
  content: z.string(),
  sender: z.string(),
  recipient: z.string(),
});

type Notification =
  | { kind: "email"; templatedEmail: TemplatedEmail }
  | { kind: "sms"; sms: Sms };

const notificationSchema: z.Schema<Notification> = z
  .object({
    kind: z.literal("email"),
    templatedEmail: templatedEmailSchema,
  })
  .or(
    z.object({
      kind: z.literal("sms"),
      sms: smsSchema,
    }),
  );

export class SendNotification extends UseCase<Notification> {
  constructor(private readonly notificationGateway: NotificationGateway) {
    super();
  }

  protected inputSchema = notificationSchema;

  protected _execute(notification: Notification): Promise<void> {
    switch (notification.kind) {
      case "email":
        return this.notificationGateway.sendEmail(notification.templatedEmail);
      case "sms":
        return this.notificationGateway.sendSms(notification.sms);
      default:
        return exhaustiveCheck(notification, {
          variableName: "notification",
          throwIfReached: true,
        });
    }
  }
}
