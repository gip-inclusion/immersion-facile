import {
  agencyKindSchema,
  conventionSchema,
  emailSchema,
  siretSchema,
  type ZodSchemaWithInputMatchingOutput,
} from "shared";
import { z } from "zod";
import type { ConventionReadPublicV2Dto } from "./ConventionReadPublicV2.dto";

export const conventionReadPublicV2Schema: ZodSchemaWithInputMatchingOutput<ConventionReadPublicV2Dto> =
  conventionSchema.and(
    z.object({
      agencyName: z.string(),
      agencyDepartment: z.string(),
      agencyKind: agencyKindSchema,
      agencySiret: siretSchema,
      agencyCounsellorEmails: z.array(emailSchema),
      agencyValidatorEmails: z.array(emailSchema),
      agencyRefersToOtherAgency: z
        .object({
          id: z.string(),
          name: z.string(),
          kind: z.string(),
        })
        .optional(),
    }),
  );

export const conventionReadPublicListV2Schema: ZodSchemaWithInputMatchingOutput<
  ConventionReadPublicV2Dto[]
> = z.array(conventionReadPublicV2Schema);
