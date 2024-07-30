import {
  agencyModifierRoles,
  allRoles,
  allSignatoryRoles,
  conventionSchema,
  reminderKinds,
  zTrimmedString,
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
    justification: zTrimmedString,
    requesterRole: z.enum(allRoles),
    modifierRole: z.enum(agencyModifierRoles),
    agencyActorEmail: zTrimmedString,
  });

const signatoryRequestConventionModificationPayloadSchema: z.Schema<SignatoryRequestModificationPayload> =
  z.object({
    convention: conventionSchema,
    justification: zTrimmedString,
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
