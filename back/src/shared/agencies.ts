import { z } from "../../node_modules/zod";
import { LatLonDto, latLonSchema } from "./latLon";
import { Flavor } from "./typeFlavors";
import { NotEmptyArray } from "./utils";
import { zEmail, zString, zTrimmedString } from "./zodUtils";

export type AgencyId = Flavor<string, "AgencyId">;
export const agencyIdSchema: z.ZodSchema<AgencyId> = zTrimmedString;

export const agencyKindList: NotEmptyArray<AgencyKind> = [
  "pole-emploi",
  "mission-locale",
  "cap-emploi",
  "conseil-departemental",
  "prepa-apprentissage",
  "structure-IAE",
  "autre",
];
const agencyKindSchema = z.enum(agencyKindList);

export type AgencyInListDto = z.infer<typeof agencyInListSchema>;
export const agencyInListSchema = z.object({
  id: agencyIdSchema,
  name: z.string(),
  position: latLonSchema,
});

export type ListAgenciesRequestDto = z.infer<typeof listAgenciesRequestSchema>;
export const listAgenciesRequestSchema = z.object({
  position: latLonSchema.optional(),
});

export const listAgenciesResponseSchema = z.array(agencyInListSchema);

export type AgencyKind =
  | "pole-emploi"
  | "mission-locale"
  | "cap-emploi"
  | "conseil-departemental"
  | "prepa-apprentissage"
  | "structure-IAE"
  | "autre";

export type CreateAgencyConfig = {
  id: AgencyId;
  kind: AgencyKind;
  name: string;
  address: string;
  position: LatLonDto;
  counsellorEmails: string[];
  validatorEmails: string[];
  // adminEmails: string[];
  questionnaireUrl?: string;
  signature: string;
};

export const agencyConfigSchema: z.ZodSchema<CreateAgencyConfig> = z.object({
  id: agencyIdSchema,
  name: zString,
  kind: agencyKindSchema,
  address: zString,
  position: latLonSchema,
  counsellorEmails: z.array(zEmail),
  validatorEmails: z.array(zEmail).min(1),
  questionnaireUrl: z.string().optional(),
  signature: zString,
});
