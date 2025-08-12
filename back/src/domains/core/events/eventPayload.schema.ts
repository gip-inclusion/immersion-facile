import {
  agencyIdSchema,
  conventionIdSchema,
  localization,
  reminderKinds,
  zStringMinLength1,
} from "shared";
import { z } from "zod/v4";
import type {
  ConventionReminderPayload,
  TransferConventionToAgencyPayload,
} from "./eventPayload.dto";

export const conventionReminderPayloadSchema: z.Schema<ConventionReminderPayload> =
  z.object({
    reminderKind: z.enum(reminderKinds, {
      error: localization.invalidEnum,
    }),
    conventionId: z.string(),
  });

export const transferConventionToAgencyPayloadSchema: z.Schema<TransferConventionToAgencyPayload> =
  z.object({
    conventionId: conventionIdSchema,
    justification: zStringMinLength1,
    agencyId: agencyIdSchema,
    previousAgencyId: agencyIdSchema,
  });
