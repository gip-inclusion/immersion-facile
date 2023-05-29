import { Flavor, TemplatedEmail, TemplatedSms } from "shared";

export type NotificationId = Flavor<string, "NotificationId">;

export type Notification = { id: NotificationId } & (
  | { kind: "email"; email: TemplatedEmail }
  | { kind: "sms"; sms: TemplatedSms }
);

export type NotificationKind = Notification["kind"];

export type WithNotificationIdAndKind = {
  id: NotificationId;
  kind: NotificationKind;
};
