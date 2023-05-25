import { z } from "zod";
import {
  exhaustiveCheck,
  TemplatedEmail,
  templatedEmailSchema,
  type TemplatedSms,
  templatedSmsSchema,
} from "shared";
import { NotificationGateway } from "../../../convention/ports/NotificationGateway";
import { UseCase } from "../../../core/UseCase";

export type Notification =
  | { kind: "email"; email: TemplatedEmail }
  | { kind: "sms"; sms: TemplatedSms };

const notificationSchema: z.Schema<Notification> = z
  .object({
    kind: z.literal("email"),
    email: templatedEmailSchema,
  })
  .or(
    z.object({
      kind: z.literal("sms"),
      sms: templatedSmsSchema,
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
        return this.notificationGateway.sendEmail(notification.email);
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
