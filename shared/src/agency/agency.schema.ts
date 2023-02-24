import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { addressSchema } from "../address/address.schema";
import { geoPositionSchema } from "../geoPosition/geoPosition.schema";
import { siretSchema } from "../siret/siret.schema";
import {
  localization,
  zEmail,
  zEnumValidation,
  zString,
  zStringPossiblyEmpty,
  zTrimmedString,
} from "../zodUtils";
import {
  AgencyDto,
  AgencyId,
  AgencyIdResponse,
  AgencyKind,
  agencyKindList,
  AgencyOption,
  AgencyPublicDisplayDto,
  allAgencyStatuses,
  CreateAgencyDto,
  ListAgenciesRequestDto,
  PrivateListAgenciesRequestDto,
  UpdateAgencyRequestDto,
  WithAgencyId,
  RegisterAgencyToInclusionConnectUserParams,
} from "./agency.dto";

export const agencyIdSchema: z.ZodSchema<AgencyId> = zTrimmedString;

export const withAgencyIdSchema: z.Schema<WithAgencyId> = z.object({
  id: agencyIdSchema,
});

export const agencyIdResponseSchema: z.ZodSchema<AgencyIdResponse> =
  agencyIdSchema.optional();

export const agencyIdAndNameSchema: z.ZodSchema<AgencyOption> = z.object({
  id: agencyIdSchema,
  name: z.string(),
});

export const agenciesIdAndNameSchema: z.ZodSchema<AgencyOption[]> = z.array(
  agencyIdAndNameSchema,
);

const agencyKindSchema: z.ZodSchema<AgencyKind> = zEnumValidation(
  agencyKindList,
  "Ce type de structure n'est pas supporté",
);

export const listAgenciesByDepartmentCodeRequestSchema: z.ZodSchema<ListAgenciesRequestDto> =
  z.object({
    departmentCode: z.string().optional(),
    nameIncludes: z.string().optional(),
    kind: z
      .enum([
        "immersionPeOnly",
        "immersionWithoutPe",
        "miniStageOnly",
        "miniStageExcluded",
      ])
      .optional(),
  });

const createAgencyShape = {
  id: agencyIdSchema,
  name: zString,
  kind: agencyKindSchema,
  address: addressSchema,
  position: geoPositionSchema,
  counsellorEmails: z.array(zEmail),
  validatorEmails: z.array(zEmail).refine((emails) => emails.length > 0, {
    message: localization.atLeastOneEmail,
  }),
  questionnaireUrl: z.string().optional(),
  signature: zString,
  logoUrl: absoluteUrlSchema.optional(),
};

export const createAgencySchema: z.ZodSchema<CreateAgencyDto> = z
  .object(createAgencyShape)
  .and(
    z.object({
      agencySiret: siretSchema,
    }),
  );

const agencyStatusSchema = z.enum(allAgencyStatuses);

export const editAgencySchema: z.ZodSchema<AgencyDto> = createAgencySchema.and(
  z.object({
    questionnaireUrl: z.string(),
    status: agencyStatusSchema,
    adminEmails: z.array(zString),
    codeSafir: zStringPossiblyEmpty,
  }),
);

export const agencySchema: z.ZodSchema<AgencyDto> = z
  .object(createAgencyShape)
  .and(
    z.object({
      agencySiret: siretSchema.optional().or(z.literal("")),
    }),
  )
  .and(
    z.object({
      questionnaireUrl: z.string(),
      status: agencyStatusSchema,
      adminEmails: z.array(zString),
      codeSafir: zStringPossiblyEmpty,
    }),
  );

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
    address: addressSchema,
    position: geoPositionSchema,
    agencySiret: siretSchema.optional().or(z.literal("")),
    logoUrl: absoluteUrlSchema.optional(),
    signature: zString,
  });

export const matchUserAndAgencySchema: z.Schema<RegisterAgencyToInclusionConnectUserParams> =
  z.object({
    agencyId: agencyIdSchema,
  });
