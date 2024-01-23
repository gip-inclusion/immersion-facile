import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
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
  zStringPossiblyEmpty,
  zTrimmedString,
} from "../zodUtils";
import {
  AgencyDto,
  AgencyId,
  AgencyIdResponse,
  AgencyKind,
  agencyKindFilters,
  agencyKindList,
  AgencyOption,
  allAgencyStatuses,
  CreateAgencyDto,
  ListAgenciesRequestDto,
  PrivateListAgenciesRequestDto,
  WithAgencyDto,
  WithAgencyId,
  WithAgencyStatus,
} from "./agency.dto";

export const agencyIdSchema: z.ZodSchema<AgencyId> = zTrimmedString;
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

export const listAgenciesRequestSchema: z.ZodSchema<ListAgenciesRequestDto> =
  z.object({
    departmentCode: z.string().optional(),
    nameIncludes: z.string().optional(),
    kind: z.enum(agencyKindFilters).optional(),
  });

const commonAgencyShape = {
  id: agencyIdSchema,
  name: stringWithMaxLength255,
  kind: agencyKindSchema,
  address: addressSchema,
  position: geoPositionSchema,
  counsellorEmails: z.array(emailSchema),
  validatorEmails: z.array(emailSchema).refine((emails) => emails.length > 0, {
    message: localization.atLeastOneEmail,
  }),
  questionnaireUrl: absoluteUrlSchema.or(z.null()),
  signature: stringWithMaxLength255,
  logoUrl: absoluteUrlSchema.or(z.null()),
  agencySiret: siretSchema,
};

export const createAgencySchema: z.ZodSchema<CreateAgencyDto> = z
  .object(commonAgencyShape)
  .and(
    z.object({
      refersToAgencyId: refersToAgencyIdSchema.or(z.null()),
    }),
  )
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
  .object(commonAgencyShape)
  .and(
    z.object({
      questionnaireUrl: absoluteUrlSchema.or(z.null()),
      status: agencyStatusSchema,
      adminEmails: z.array(zStringMinLength1),
      codeSafir: zStringPossiblyEmpty,
      refersToAgencyId: refersToAgencyIdSchema.or(z.null()),
      rejectionJustification: zStringMinLength1.or(z.null()),
    }),
  );

export const agencySchema: z.ZodSchema<AgencyDto> = z
  .object(commonAgencyShape)
  .merge(
    z.object({
      agencySiret: siretSchema,
      questionnaireUrl: absoluteUrlSchema.or(z.null()),
      status: agencyStatusSchema,
      adminEmails: z.array(zStringMinLength1),
      codeSafir: zStringMinLength1.or(z.null()),
      refersToAgencyId: refersToAgencyIdSchema.or(z.null()),
      rejectionJustification: z.string().or(z.null()),
    }),
  );

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
        rejectionJustification: zTrimmedString,
      }),
    );

export const updateAgencyStatusParamsSchema: z.Schema<UpdateAgencyStatusParams> =
  updateAgencyStatusParamsWithoutIdSchema.and(z.object({ id: agencyIdSchema }));

export const withAgencyStatusSchema: z.Schema<WithAgencyStatus> = z.object({
  status: agencyStatusSchema,
});
