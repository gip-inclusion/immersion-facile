import { z } from "zod";
import {
  allModifierRoles,
  allRoles,
  conventionSchema,
  zTrimmedString,
} from "shared";
import { ConventionRequiresModificationPayload } from "./eventPayload.dto";

export const conventionRequiresModificationPayloadSchema: z.Schema<ConventionRequiresModificationPayload> =
  z.object({
    convention: conventionSchema,
    justification: zTrimmedString,
    role: z.enum(allRoles),
    modifierRole: z.enum(allModifierRoles),
  });
