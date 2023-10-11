import { z } from "zod";
import {
  agencyKindSchema,
  ConventionReadDto,
  conventionSchema,
  siretSchema,
} from "shared";

export const conventionReadPublicV2Schema: z.Schema<ConventionReadDto> =
  conventionSchema.and(
    z.object({
      agencyName: z.string(),
      agencyDepartment: z.string(),
      agencyKind: agencyKindSchema,
      agencySiret: siretSchema.optional(),
    }),
  );
