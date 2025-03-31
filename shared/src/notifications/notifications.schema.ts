import { z } from "zod";
import { agencyIdSchema } from "../agency/agency.schema";
import { conventionIdSchema } from "../convention/convention.schema";
import { templatedEmailSchema } from "../email/email.schema";
import { userIdSchema } from "../inclusionConnectedAllowed/inclusionConnectedAllowed.schema";
import {
  dateTimeIsoStringSchema,
  makeDateStringSchema,
} from "../schedule/Schedule.schema";
import { siretSchema } from "../siret/siret.schema";
import { templatedSmsSchema } from "../sms/sms.schema";
import { localization } from "../zodUtils";
import type {
  EmailNotification,
  FollowedIds,
  NotificationCommonFields,
  NotificationId,
  NotificationState,
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
  userId: userIdSchema.optional(),
});

const notificationStateSchema: z.Schema<NotificationState> = z
  .object({
    status: z.enum(["to-be-sent", "accepted"]),
    occurredAt: dateTimeIsoStringSchema,
  })
  .or(
    z.object({
      status: z.literal("errored"),
      occurredAt: dateTimeIsoStringSchema,
      httpStatus: z.number(),
      message: z.string(),
    }),
  );

const notificationCommonSchema: z.Schema<NotificationCommonFields> = z.object({
  id: notificationIdSchema,
  createdAt: makeDateStringSchema(),
  followedIds: followedIdsSchema,
  state: notificationStateSchema,
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
