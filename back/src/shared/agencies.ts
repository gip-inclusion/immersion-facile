import { z } from "../../node_modules/zod";
import { latLonSchema } from "./SearchImmersionDto";
import { Flavor } from "./typeFlavors";
import { zTrimmedString } from "./zodUtils";

export type AgencyId = Flavor<string, "AgencyId">;
export const agencyIdSchema: z.ZodSchema<AgencyId> = zTrimmedString;

export type AgencyDto = z.infer<typeof agencySchema>;
export const agencySchema = z.object({
  id: agencyIdSchema,
  name: z.string(),
  position: latLonSchema,
});

export type ListAgenciesRequestDto = z.infer<typeof listAgenciesRequestSchema>;
export const listAgenciesRequestSchema = z.void();

export type ListAgenciesResponseDto = z.infer<
  typeof listAgenciesResponseSchema
>;
export const listAgenciesResponseSchema = z.array(agencySchema);
