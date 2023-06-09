import { AgencyId } from "../agency/agency.dto";
import { ConventionId } from "../convention/convention.dto";
import { TemplatedEmail } from "../email/email";
import { AuthenticatedUserId } from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import { SiretDto } from "../siret/siret";
import { TemplatedSms } from "../sms/smsTemplateByName";
import { Flavor } from "../typeFlavors";
import { DateStr } from "../utils/date";

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
  userId?: AuthenticatedUserId;
};

export type NotificationCommonFields = {
  id: NotificationId;
  createdAt: DateStr;
  followedIds: FollowedIds;
};

export type Notification = NotificationCommonFields & NotificationContent;

export type SmsNotification = Extract<Notification, { kind: "sms" }>;
export type EmailNotification = Extract<Notification, { kind: "email" }>;

export type NotificationsByKind = {
  emails: EmailNotification[];
  sms: SmsNotification[];
};
