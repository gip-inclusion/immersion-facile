import {
  agencyModifierRoles,
  allRoles,
  allSignatoryRoles,
  conventionSchema,
  reminderKinds,
  zStringMinLength1,
} from "shared";
import { z } from "zod";
import {
  AgencyActorRequestModificationPayload,
  ConventionReminderPayload,
  ConventionRequiresModificationPayload,
  SignatoryRequestModificationPayload,
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
