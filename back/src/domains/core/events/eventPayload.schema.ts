import {
  agencyIdSchema,
  delegationConventionReminderKinds,
  localization,
  reminderKinds,
  withConventionSchema,
  type ZodSchemaWithInputMatchingOutput,
  zStringMinLength1Max1024,
} from "shared";
import { z } from "zod";
import type {
  ConventionReminderPayload,
  DelegationConventionReminderPayload,
  TransferConventionToAgencyPayload,
} from "./eventPayload.dto";

export const conventionReminderPayloadSchema: ZodSchemaWithInputMatchingOutput<ConventionReminderPayload> =
  z.object({
    reminderKind: z.enum(reminderKinds, {
      error: localization.invalidEnum,
    }),
    conventionId: z.string(),
  });

export const delegationConventionReminderPayloadSchema: ZodSchemaWithInputMatchingOutput<DelegationConventionReminderPayload> =
  z.object({
    agencyId: agencyIdSchema,
    reminderKind: z.enum(delegationConventionReminderKinds, {
      error: localization.invalidEnum,
    }),
  });

export const transferConventionToAgencyPayloadSchema: ZodSchemaWithInputMatchingOutput<TransferConventionToAgencyPayload> =
  withConventionSchema.and(
    z.object({
      justification: zStringMinLength1Max1024,
      agencyId: agencyIdSchema,
      previousAgencyId: agencyIdSchema,
      shouldNotifyActors: z.boolean(),
    }),
  );
