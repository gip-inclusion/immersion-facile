import { z } from "zod";
import { agencyIdSchema } from "../agency/agency.schema";
import { conventionIdSchema } from "../convention/convention.schema";
import { templatedEmailSchema } from "../email/email.schema";
import { authenticatedUserIdSchema } from "../inclusionConnectedAllowed/inclusionConnectedAllowed.schema";
import { siretSchema } from "../siret/siret.schema";
import { templatedSmsSchema } from "../sms/sms.schema";
import { dateRegExp } from "../utils/date";
import { localization, zString } from "../zodUtils";
import {
  EmailNotification,
  FollowedIds,
  NotificationCommonFields,
  NotificationId,
  NotificationsByKind,
  SmsNotification,
} from "./notifications.dto";

const notificationIdSchema: z.Schema<NotificationId> = z
  .string()
  .uuid(localization.invalidUuid);
const followedIdsSchema: z.Schema<FollowedIds> = z.object({
  conventionId: conventionIdSchema.optional(),
  establishmentSiret: siretSchema.optional(),
  agencyId: agencyIdSchema.optional(),
  userId: authenticatedUserIdSchema.optional(),
});

const notificationCommonSchema: z.Schema<NotificationCommonFields> = z.object({
  id: notificationIdSchema,
  createdAt: zString.regex(dateRegExp),
  followedIds: followedIdsSchema,
});

const emailNotificationSchema: z.Schema<EmailNotification> =
  notificationCommonSchema.and(
    z.object({
      kind: z.literal("email"),
      templatedContent: templatedEmailSchema,
    }),
  );

const smsNotificationSchema: z.Schema<SmsNotification> =
  notificationCommonSchema.and(
    z.object({
      kind: z.literal("sms"),
      templatedContent: templatedSmsSchema,
    }),
  );
export const notificationsByKindSchema: z.Schema<NotificationsByKind> =
  z.object({
    emails: z.array(emailNotificationSchema),
    sms: z.array(smsNotificationSchema),
  });
