import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import {
  AgencyId,
  AgencyInListDto,
  AgencyKind,
  agencyKindList,
  CreateAgencyDto,
  ListAgenciesRequestDto,
  WithAgencyId,
} from "./agency.dto";
import { latLonSchema } from "../latLon";
import {
  zEmail,
  zPreprocessedNumber,
  zString,
  zTrimmedString,
} from "../zodUtils";

export const agencyIdSchema: z.ZodSchema<AgencyId> = zTrimmedString;

export const withAgencyIdSchema: z.Schema<WithAgencyId> = z.object({
  id: agencyIdSchema,
});

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
    lat: zPreprocessedNumber(),
    lon: zPreprocessedNumber(),
    filter: z.enum(["peOnly", "peExcluded"]).optional(),
  });

export const agencySchema: z.ZodSchema<CreateAgencyDto> = z.object({
  id: agencyIdSchema,
  name: zString,
  kind: agencyKindSchema,
  address: zString,
  position: latLonSchema,
  counsellorEmails: z.array(zEmail),
  validatorEmails: z.array(zEmail).min(1),
  questionnaireUrl: z.string().optional(),
  signature: zString,
  logoUrl: absoluteUrlSchema.optional(),
});
