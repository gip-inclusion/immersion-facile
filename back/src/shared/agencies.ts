import { z } from "../../node_modules/zod";
import { LatLonDto, latLonSchema } from "./SearchImmersionDto";
import { Flavor } from "./typeFlavors";
import { NotEmptyArray } from "./utils";
import { zEmail, zString, zTrimmedString } from "./zodUtils";

export type AgencyId = Flavor<string, "AgencyId">;
export const agencyIdSchema: z.ZodSchema<AgencyId> = zTrimmedString;

export type AgencyDto = z.infer<typeof agencySchema>;
export const agencySchema = z.object({
  id: agencyIdSchema,
  name: z.string(),
  position: latLonSchema,
});

export type ListAgenciesRequestDto = z.infer<typeof listAgenciesRequestSchema>;
export const listAgenciesRequestSchema = z.object({
  position: latLonSchema.optional(),
});

export const listAgenciesResponseSchema = z.array(agencySchema);

export type AgencyKind =
  | "mission-locale"
  | "pole-emploi"
  | "cap-emploi"
  | "conseil-départemental"
  | "prépa-apprentissage"
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
  questionnaireUrl: string;
  signature: string;
};

const agencyKindList: NotEmptyArray<AgencyKind> = [
  "mission-locale",
  "pole-emploi",
  "cap-emploi",
  "conseil-départemental",
  "prépa-apprentissage",
  "structure-IAE",
  "autre",
];
const agencyKindSchema = z.enum(agencyKindList);

export const agencyConfigSchema: z.ZodSchema<CreateAgencyConfig> = z.object({
  id: agencyIdSchema,
  name: zString,
  kind: agencyKindSchema,
  address: zString,
  position: latLonSchema,
  counsellorEmails: z.array(zEmail),
  validatorEmails: z.array(zEmail),
  questionnaireUrl: zString,
  signature: zString,
});
