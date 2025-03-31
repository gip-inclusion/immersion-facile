import type { AgencyId } from "../agency/agency.dto";
import type { ConventionId } from "../convention/convention.dto";
import type { TemplatedEmail } from "../email/email";
import type { UserId } from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import type { SiretDto } from "../siret/siret";
import type { TemplatedSms } from "../sms/smsTemplateByName";
import type { Flavor } from "../typeFlavors";
import type { DateString, DateTimeIsoString } from "../utils/date";

export type NotificationId = Flavor<string, "NotificationId">;

export type NotificationKind = (typeof notificationKinds)[number];
export const notificationKinds = ["email", "sms"] as const;

type GenericNotification<K extends NotificationKind, TemplatedContent> = {
  kind: K;
  templatedContent: TemplatedContent;
};

export type NotificationContent =
  | GenericNotification<"email", TemplatedEmail>
  | GenericNotification<"sms", TemplatedSms>;

const _isAssignable = (kind: NotificationKind): NotificationContent["kind"] =>
  kind;

export type FollowedIds = {
  conventionId?: ConventionId;
  establishmentSiret?: SiretDto;
  agencyId?: AgencyId;
  userId?: UserId;
};

export type NotificationState =
  | {
      status: "to-be-sent" | "accepted";
      occurredAt: DateTimeIsoString;
    }
  | NotificationErrored;

export type NotificationErrored = {
  status: "errored";
  occurredAt: DateTimeIsoString;
  httpStatus: number;
  message: string;
};

export type NotificationCommonFields = {
  id: NotificationId;
  createdAt: DateString;
  followedIds: FollowedIds;
  state?: NotificationState;
};

export type Notification = NotificationCommonFields & NotificationContent;

export type SmsNotification = Extract<Notification, { kind: "sms" }>;
export type EmailNotification = Extract<Notification, { kind: "email" }>;

export type NotificationsByKind = {
  emails: EmailNotification[];
  sms: SmsNotification[];
};
