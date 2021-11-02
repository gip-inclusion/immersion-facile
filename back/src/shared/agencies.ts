import { z } from "../../node_modules/zod";
import { Flavor } from "./typeFlavors";
import { NotEmptyArray } from "./utils";
import { zTrimmedString } from "./zodUtils";

export type AgencyId = Flavor<string, "AgencyId">;
export const agencyIdSchema: z.ZodSchema<AgencyId> = zTrimmedString;

/// TODO(nwettstein): Remove when agency ids have fully replaced agency codes.
export const legacyAgencyIds: Partial<Record<AgencyCode, AgencyId>> = {
  AMIE_BOULONAIS: "a025666a-22d7-4752-86eb-d07e27a5766a",
  MLJ_GRAND_NARBONNE: "b0d734df-3047-4e42-aaca-9d86b9e1c81d",
  ML_PARIS_SOLEIL: "c0fddfd9-8fdd-4e1e-8b99-ed5d733d3b83",
};

// TODO(nwettstein): Remove when agency ids have fully replaced agency codes.
export const getAgencyCodeFromApplication = ({
  agencyCode,
  agencyId,
}: {
  agencyCode?: AgencyCode;
  agencyId?: AgencyId;
}): AgencyId => {
  const id = agencyId || (agencyCode ? legacyAgencyIds[agencyCode] : undefined);
  if (id) return id;
  throw new Error(`Error determining agency code: ${agencyCode}, ${agencyId}`);
};

export type AgencyCode = keyof typeof agencyCodes;
export const agencyCodes = {
  _UNKNOWN: "Unknown",
  AMIE_BOULONAIS: "AMIE du Boulonnais",
  MLJ_GRAND_NARBONNE: "Mission Locale Jeunes du Grand Narbonne",
  ML_PARIS_SOLEIL: "Site Soleil - Mission Locale de Paris",
};

export const validAgencyCodes = Object.keys(agencyCodes).filter(
  (val) => val !== "_UNKNOWN",
) as NotEmptyArray<AgencyCode>;

export const agencyCodeFromString = (s: string): AgencyCode => {
  const source = s as AgencyCode;
  if (validAgencyCodes.includes(source)) return source;
  return "_UNKNOWN";
};

// This enum uses a refinement to check for validity because there is no easy
// way to customize the error message for invalid enum values.
export const agencyCodeSchema = z
  .enum(Object.keys(agencyCodes) as NotEmptyArray<AgencyCode>)
  .refine((val) => !val || validAgencyCodes.includes(val), {
    message: "Obligatoire",
  });

export type AgencyDto = z.infer<typeof agencySchema>;
export const agencySchema = z.object({
  id: agencyIdSchema,
  name: z.string(),
});

export type ListAgenciesRequestDto = z.infer<typeof listAgenciesRequestSchema>;
export const listAgenciesRequestSchema = z.void();

export type ListAgenciesResponseDto = z.infer<
  typeof listAgenciesResponseSchema
>;
export const listAgenciesResponseSchema = z.array(agencySchema);
