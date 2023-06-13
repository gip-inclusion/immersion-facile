import { z } from "zod";
import { allRoles, conventionSchema, zTrimmedString } from "shared";
import { ConventionRequiresModificationPayload } from "./eventPayload.dto";

export const conventionRequiresModificationPayloadSchema: z.Schema<ConventionRequiresModificationPayload> =
  z.object({
    convention: conventionSchema,
    justification: zTrimmedString,
    roles: z.array(z.enum(allRoles)),
  });
