import { z } from "zod";
import {
  AgencyId,
  AgencyInListDto,
  AgencyKind,
  agencyKindList,
  CreateAgencyConfig,
  ListAgenciesRequestDto,
} from "./agency.dto";
import { latLonSchema } from "../latLon";
import { zEmail, zString, zTrimmedString } from "../zodUtils";

export const agencyIdSchema: z.ZodSchema<AgencyId> = zTrimmedString;

export const agencyInListSchema: z.ZodSchema<AgencyInListDto> = z.object({
  id: agencyIdSchema,
  name: z.string(),
  position: latLonSchema,
});

export const listAgenciesResponseSchema: z.ZodSchema<AgencyInListDto[]> =
  z.array(agencyInListSchema);

const agencyKindSchema: z.ZodSchema<AgencyKind> = z.enum(agencyKindList);

export const listAgenciesRequestSchema: z.ZodSchema<ListAgenciesRequestDto> =
  z.object({
    position: latLonSchema.optional(),
  });

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
