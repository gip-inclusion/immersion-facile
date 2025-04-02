import {
  agencyIdSchema,
  agencyModifierRoles,
  allRoles,
  allSignatoryRoles,
  conventionIdSchema,
  conventionSchema,
  reminderKinds,
  zStringMinLength1,
} from "shared";
import { z } from "zod";
import type {
  AgencyActorRequestModificationPayload,
  ConventionReminderPayload,
  ConventionRequiresModificationPayload,
  SignatoryRequestModificationPayload,
  TransferConventionToAgencyPayload,
} from "./eventPayload.dto";

const agencyActorRequestConventionModificationPayloadSchema: z.Schema<AgencyActorRequestModificationPayload> =
  z.object({
    convention: conventionSchema,
    justification: zStringMinLength1,
    requesterRole: z.enum(allRoles),
    modifierRole: z.enum(agencyModifierRoles),
    agencyActorEmail: zStringMinLength1,
  });

const signatoryRequestConventionModificationPayloadSchema: z.Schema<SignatoryRequestModificationPayload> =
  z.object({
    convention: conventionSchema,
    justification: zStringMinLength1,
    requesterRole: z.enum(allRoles),
    modifierRole: z.enum(allSignatoryRoles),
  });

export const conventionRequiresModificationPayloadSchema: z.Schema<ConventionRequiresModificationPayload> =
  z.union([
    agencyActorRequestConventionModificationPayloadSchema,
    signatoryRequestConventionModificationPayloadSchema,
  ]);

export const conventionReminderPayloadSchema: z.Schema<ConventionReminderPayload> =
  z.object({
    reminderKind: z.enum(reminderKinds),
    conventionId: z.string(),
  });

export const transferConventionToAgencyPayloadSchema: z.Schema<TransferConventionToAgencyPayload> =
  z.object({
    conventionId: conventionIdSchema,
    justification: zStringMinLength1,
    agencyId: agencyIdSchema,
    previousAgencyId: agencyIdSchema,
  });
