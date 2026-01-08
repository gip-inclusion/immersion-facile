import {
  agencyKindSchema,
  assessmentStatuses,
  conventionSchema,
  emailSchema,
  legacyAssessmentStatuses,
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
      agencyContactEmail: emailSchema,
      agencySiret: siretSchema,
      agencyCounsellorEmails: z.array(emailSchema),
      agencyValidatorEmails: z.array(emailSchema),
      agencyRefersToOtherAgency: z
        .object({
          id: z.string(),
          name: z.string(),
          contactEmail: emailSchema,
          kind: z.string(),
        })
        .optional(),
      assessment: z
        .union([
          z.object({
            status: z.enum(assessmentStatuses),
            endedWithAJob: z.boolean(),
          }),
          z.object({
            status: z.enum(legacyAssessmentStatuses),
          }),
        ])
        .nullable(),
    }),
  );

export const conventionReadPublicListV2Schema: ZodSchemaWithInputMatchingOutput<
  ConventionReadPublicV2Dto[]
> = z.array(conventionReadPublicV2Schema);
