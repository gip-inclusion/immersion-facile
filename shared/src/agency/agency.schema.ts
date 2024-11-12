import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { withAcquisitionSchema } from "../acquisition.dto";
import { addressSchema } from "../address/address.schema";
import {
  UpdateAgencyStatusParams,
  UpdateAgencyStatusParamsWithoutId,
} from "../admin/admin.dto";
import { emailSchema } from "../email/email.schema";
import { geoPositionSchema } from "../geoPosition/geoPosition.schema";
import { siretSchema } from "../siret/siret.schema";
import {
  localization,
  stringWithMaxLength255,
  zEnumValidation,
  zSchemaForType,
  zStringMinLength1,
} from "../zodUtils";
import {
  AgencyDto,
  AgencyDtoWithoutEmails,
  AgencyId,
  AgencyIdResponse,
  AgencyKind,
  AgencyOption,
  CreateAgencyDto,
  ListAgencyOptionsRequestDto,
  PrivateListAgenciesRequestDto,
  WithAgencyDto,
  WithAgencyId,
  WithAgencyStatus,
  agencyKindFilters,
  agencyKindList,
  allAgencyStatuses,
} from "./agency.dto";

export const agencyIdSchema: z.ZodSchema<AgencyId> = zStringMinLength1;
export const refersToAgencyIdSchema: z.ZodSchema<AgencyId> = z.string();
export const agencyIdsSchema: z.Schema<AgencyId[]> = z
  .array(agencyIdSchema)
  .nonempty();

export const withAgencyIdSchema = zSchemaForType<WithAgencyId>()(
  z.object({
    agencyId: agencyIdSchema,
  }),
);

export const agencyIdResponseSchema: z.ZodSchema<AgencyIdResponse> =
  agencyIdSchema.optional();

export const agencyKindSchema: z.ZodSchema<AgencyKind> = zEnumValidation(
  agencyKindList,
  "Ce type de structure n'est pas supporté",
);

export const agencyIdAndNameSchema: z.ZodSchema<AgencyOption> = z.object({
  id: agencyIdSchema,
  name: z.string(),
  kind: agencyKindSchema,
});

export const agenciesIdAndNameSchema: z.ZodSchema<AgencyOption[]> = z.array(
  agencyIdAndNameSchema,
);

export const listAgencyOptionsRequestSchema: z.ZodSchema<ListAgencyOptionsRequestDto> =
  z.object({
    departmentCode: z.string().optional(),
    nameIncludes: z.string().optional(),
    filterKind: z.enum(agencyKindFilters).optional(),
    siret: z.string().optional(),
  });

const withEmails = {
  counsellorEmails: z.array(emailSchema),
  validatorEmails: z.array(emailSchema).refine((emails) => emails.length > 0, {
    message: localization.atLeastOneEmail,
  }),
};

const commonAgencyShape = {
  id: agencyIdSchema,
  name: stringWithMaxLength255,
  kind: agencyKindSchema,
  coveredDepartments: z.array(zStringMinLength1).min(1),
  address: addressSchema,
  position: geoPositionSchema,
  questionnaireUrl: absoluteUrlSchema.or(z.null()),
  signature: stringWithMaxLength255,
  logoUrl: absoluteUrlSchema.or(z.null()),
  agencySiret: siretSchema,
};

export const createAgencySchema: z.ZodSchema<CreateAgencyDto> = z
  .object({ ...commonAgencyShape, ...withEmails })
  .and(
    z.object({
      refersToAgencyId: refersToAgencyIdSchema.or(z.null()),
      refersToAgencyName: zStringMinLength1.or(z.null()),
    }),
  )
  .and(withAcquisitionSchema)
  .superRefine((createAgency, context) => {
    if (
      createAgency.refersToAgencyId &&
      !createAgency.counsellorEmails.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["counsellorEmails"],
        message:
          "Une structure d'accompagnement doit avoir au moins un email de conseiller pour examen préabable",
      });
    }
  });

const agencyStatusSchema = z.enum(allAgencyStatuses);

export const editAgencySchema: z.ZodSchema<AgencyDto> = z
  .object({ ...commonAgencyShape, ...withEmails })
  .and(
    z.object({
      questionnaireUrl: absoluteUrlSchema.or(z.null()),
      status: agencyStatusSchema,
      codeSafir: zStringMinLength1.or(z.null()),
      refersToAgencyId: refersToAgencyIdSchema.or(z.null()),
      refersToAgencyName: zStringMinLength1.or(z.null()),
      rejectionJustification: zStringMinLength1.or(z.null()),
    }),
  )
  .and(withAcquisitionSchema);

export const agencyWithoutEmailSchema: z.Schema<AgencyDtoWithoutEmails> = z
  .object(commonAgencyShape)
  .merge(
    z.object({
      agencySiret: siretSchema,
      questionnaireUrl: absoluteUrlSchema.or(z.null()),
      status: agencyStatusSchema,
      codeSafir: zStringMinLength1.or(z.null()),
      refersToAgencyId: refersToAgencyIdSchema.or(z.null()),
      refersToAgencyName: zStringMinLength1.or(z.null()),
      rejectionJustification: z.string().or(z.null()),
    }),
  )
  .and(withAcquisitionSchema);

export const agencySchema: z.ZodSchema<AgencyDto> = z
  .object({ ...commonAgencyShape, ...withEmails })
  .merge(
    z.object({
      agencySiret: siretSchema,
      questionnaireUrl: absoluteUrlSchema.or(z.null()),
      status: agencyStatusSchema,
      codeSafir: zStringMinLength1.or(z.null()),
      refersToAgencyId: refersToAgencyIdSchema.or(z.null()),
      refersToAgencyName: zStringMinLength1.or(z.null()),
      rejectionJustification: z.string().or(z.null()),
    }),
  )
  .and(withAcquisitionSchema);

export const withAgencySchema: z.ZodSchema<WithAgencyDto> = z.object({
  agency: agencySchema,
});

export const privateListAgenciesRequestSchema: z.ZodSchema<PrivateListAgenciesRequestDto> =
  z.object({
    status: agencyStatusSchema.optional(),
  });

export const updateAgencyStatusParamsWithoutIdSchema: z.Schema<UpdateAgencyStatusParamsWithoutId> =
  z
    .object({
      status: z.literal("active"),
    })
    .or(
      z.object({
        status: z.literal("rejected"),
        rejectionJustification: zStringMinLength1,
      }),
    );

export const updateAgencyStatusParamsSchema: z.Schema<UpdateAgencyStatusParams> =
  updateAgencyStatusParamsWithoutIdSchema.and(z.object({ id: agencyIdSchema }));

export const withAgencyStatusSchema: z.Schema<WithAgencyStatus> = z.object({
  status: agencyStatusSchema,
});
