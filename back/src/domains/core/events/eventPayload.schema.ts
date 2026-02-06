import {
  agencyIdSchema,
  localization,
  reminderKinds,
  withConventionSchema,
  type ZodSchemaWithInputMatchingOutput,
  zStringMinLength1,
} from "shared";
import { z } from "zod";
import type {
  ConventionReminderPayload,
  TransferConventionToAgencyPayload,
} from "./eventPayload.dto";

export const conventionReminderPayloadSchema: ZodSchemaWithInputMatchingOutput<ConventionReminderPayload> =
  z.object({
    reminderKind: z.enum(reminderKinds, {
      error: localization.invalidEnum,
    }),
    conventionId: z.string(),
  });

export const transferConventionToAgencyPayloadSchema: ZodSchemaWithInputMatchingOutput<TransferConventionToAgencyPayload> =
  withConventionSchema.and(
    z.object({
      justification: zStringMinLength1,
      agencyId: agencyIdSchema,
      previousAgencyId: agencyIdSchema,
      shouldNotifyActors: z.boolean(),
    }),
  );
