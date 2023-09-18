import { z } from "zod";
import { ConventionReadDto, conventionSchema } from "shared";

export const conventionReadPublicV2Schema: z.Schema<ConventionReadDto> =
  conventionSchema.and(
    z.object({
      agencyName: z.string(),
      agencyDepartment: z.string(),
    }),
  );
