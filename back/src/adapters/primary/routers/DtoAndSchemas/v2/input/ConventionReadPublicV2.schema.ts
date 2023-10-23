import { z } from "zod";
import { agencyKindSchema, conventionSchema, siretSchema } from "shared";
import { ConventionReadPublicV2Dto } from "./ConventionReadPublicV2.dto";

export const conventionReadPublicV2Schema: z.Schema<ConventionReadPublicV2Dto> =
  conventionSchema.and(
    z.object({
      agencyName: z.string(),
      agencyDepartment: z.string(),
      agencyKind: agencyKindSchema,
      agencySiret: siretSchema.optional(),
      agencyRefersToOtherAgency: z
        .object({
          id: z.string(),
          name: z.string(),
        })
        .optional(),
    }),
  );
