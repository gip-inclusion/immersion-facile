import { z } from "zod";
import { agencyIdSchema } from "../agency/agency.schema";
import { conventionIdSchema } from "../convention/convention.schema";
import { templatedEmailSchema } from "../email/email.schema";
import { signatoryRoleSchema } from "../role/role.schema";
import { siretSchema } from "../siret/siret.schema";
import { templatedSmsSchema } from "../sms/sms.schema";
import { userIdSchema } from "../user/user.schema";
import { dateTimeIsoStringSchema, makeDateStringSchema } from "../utils/date";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import {
  type EmailNotification,
  type FollowedIds,
  type NotificationCommonFields,
  type NotificationErrored,
  type NotificationId,
  type NotificationKind,
  type NotificationState,
  type NotificationsByKind,
  notificationKinds,
  type SendAssessmentLinkRequestDto,
  type SendSignatureLinkRequestDto,
  type SmsNotification,
} from "./notifications.dto";

export const notificationIdSchema: ZodSchemaWithInputMatchingOutput<NotificationId> =
  z.uuid(localization.invalidUuid);

const followedIdsSchema: ZodSchemaWithInputMatchingOutput<FollowedIds> =
  z.object({
    conventionId: conventionIdSchema.optional(),
    establishmentSiret: siretSchema.optional(),
    agencyId: agencyIdSchema.optional(),
    userId: userIdSchema.optional(),
  });

export const notificationErroredSchema: ZodSchemaWithInputMatchingOutput<NotificationErrored> =
  z.object({
    status: z.literal("errored"),
    occurredAt: dateTimeIsoStringSchema,
    httpStatus: z.number(),
    message: z.string(),
  });

const notificationStateSchema: ZodSchemaWithInputMatchingOutput<NotificationState> =
  z.union([
    z.object({
      status: z.literal("to-be-send"),
      occurredAt: dateTimeIsoStringSchema,
    }),
    z.object({
      status: z.literal("accepted"),
      occurredAt: dateTimeIsoStringSchema,
      messageIds: z.array(z.string().or(z.number())),
    }),
    notificationErroredSchema,
  ]);

const notificationCommonSchema: ZodSchemaWithInputMatchingOutput<NotificationCommonFields> =
  z.object({
    id: notificationIdSchema,
    createdAt: makeDateStringSchema(),
    followedIds: followedIdsSchema,
    state: notificationStateSchema.optional(),
  });

const emailNotificationSchema: ZodSchemaWithInputMatchingOutput<EmailNotification> =
  notificationCommonSchema.and(
    z.object({
      kind: z.literal("email"),
      templatedContent: templatedEmailSchema,
    }),
  );

const smsNotificationSchema: ZodSchemaWithInputMatchingOutput<SmsNotification> =
  notificationCommonSchema.and(
    z.object({
      kind: z.literal("sms"),
      templatedContent: templatedSmsSchema,
    }),
  );
export const notificationsByKindSchema: ZodSchemaWithInputMatchingOutput<NotificationsByKind> =
  z.object({
    emails: z.array(emailNotificationSchema),
    sms: z.array(smsNotificationSchema),
  });

export const notificationKindSchema: ZodSchemaWithInputMatchingOutput<NotificationKind> =
  z.enum(notificationKinds, {
    error: localization.invalidEnum,
  });

export const sendSignatureLinkRequestSchema: ZodSchemaWithInputMatchingOutput<SendSignatureLinkRequestDto> =
  z.object({
    conventionId: conventionIdSchema,
    signatoryRole: signatoryRoleSchema,
    notificationKind: notificationKindSchema,
  });
export const sendAssessmentLinkRequestSchema: ZodSchemaWithInputMatchingOutput<SendAssessmentLinkRequestDto> =
  z.object({
    conventionId: conventionIdSchema,
    notificationKind: notificationKindSchema,
  });
