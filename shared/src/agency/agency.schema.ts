import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import {
  AgencyId,
  AgencyIdAndName,
  AgencyKind,
  agencyKindList,
  CreateAgencyDto,
  ListAgenciesWithPositionRequestDto,
  WithAgencyId,
  PrivateListAgenciesRequestDto,
  allAgencyStatuses,
  AgencyDto,
  UpdateAgencyRequestDto,
  AgencyPublicDisplayDto,
  AgencyIdResponse,
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

export const agencyIdResponseSchema: z.ZodSchema<AgencyIdResponse> = z.union([
  agencyIdSchema,
  z.object({ success: z.boolean() }),
]);

export const agencyWithPositionSchema: z.ZodSchema<AgencyIdAndName> = z.object({
  id: agencyIdSchema,
  name: z.string(),
  position: latLonSchema,
});

export const agenciesWithPositionSchema: z.ZodSchema<AgencyIdAndName[]> =
  z.array(agencyWithPositionSchema);

const agencyKindSchema: z.ZodSchema<AgencyKind> = z.enum(agencyKindList);

export const listAgenciesRequestSchema: z.ZodSchema<ListAgenciesWithPositionRequestDto> =
  z.object({
    countyCode: zPreprocessedNumber(),
    filter: z.enum(["peOnly", "peExcluded"]).optional(),
  });

const createAgencyShape = {
  id: agencyIdSchema,
  name: zString,
  kind: agencyKindSchema,
  address: zString,
  position: latLonSchema,
  counsellorEmails: z.array(zEmail),
  validatorEmails: z.array(zEmail).min(1),
  questionnaireUrl: z.string().optional(),
  signature: zString,
  countyCode: z.number(),
  logoUrl: absoluteUrlSchema.optional(),
};

export const createAgencySchema: z.ZodSchema<CreateAgencyDto> =
  z.object(createAgencyShape);

const agencyStatusSchema = z.enum(allAgencyStatuses);

export const agencySchema: z.ZodSchema<AgencyDto> = z.object({
  ...createAgencyShape,
  questionnaireUrl: z.string(),
  status: agencyStatusSchema,
  adminEmails: z.array(zString),
  agencySiret: zString.optional(),
  codeSafir: zString.optional(),
});

export const agenciesSchema: z.ZodSchema<AgencyDto[]> = z.array(agencySchema);

export const privateListAgenciesRequestSchema: z.ZodSchema<PrivateListAgenciesRequestDto> =
  z.object({
    status: agencyStatusSchema.optional(),
  });

export const updateAgencyRequestSchema: z.ZodSchema<UpdateAgencyRequestDto> =
  z.object({
    id: agencyIdSchema,
    status: agencyStatusSchema.optional(),
  });

export const agencyPublicDisplaySchema: z.ZodSchema<AgencyPublicDisplayDto> =
  z.object({
    id: agencyIdSchema,
    name: zString,
    address: zString,
    position: latLonSchema,
    logoUrl: absoluteUrlSchema.optional(),
  });
