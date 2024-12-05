import {
  agencyKindSchema,
  conventionSchema,
  emailSchema,
  siretSchema,
} from "shared";
import { z } from "zod";
import { ConventionReadPublicV2Dto } from "./ConventionReadPublicV2.dto";

export const conventionReadPublicV2Schema: z.Schema<ConventionReadPublicV2Dto> =
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
