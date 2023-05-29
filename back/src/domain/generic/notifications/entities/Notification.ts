import { Flavor, TemplatedEmail, TemplatedSms } from "shared";
import { DateStr } from "../../../core/ports/TimeGateway";

export type NotificationId = Flavor<string, "NotificationId">;

type FollowedIds = {
  conventionId?: string;
  establishmentId?: string;
  agencyId?: string;
};

export type Notification = {
  id: NotificationId;
  createdAt: DateStr;
  followedIds: FollowedIds;
} & (
  | { kind: "email"; email: TemplatedEmail }
  | { kind: "sms"; sms: TemplatedSms }
);

export type NotificationKind = Notification["kind"];

export type WithNotificationIdAndKind = {
  id: NotificationId;
  kind: NotificationKind;
};
