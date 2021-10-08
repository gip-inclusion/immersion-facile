import { z } from "../../node_modules/zod";
import { NotEmptyArray } from "./utils";

export type AgencyCode = keyof typeof agencyCodes;
export const agencyCodes = {
  _UNKNOWN: "Unknown",
  AMIE_BOULONAIS: "AMIE du Boulonnais",
  MLJ_GRAND_NARBONNE: "Mission Locale Jeunes du Grand Narbonne",
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
  .refine((val) => validAgencyCodes.includes(val), {
    message: "Obligatoire",
  });
