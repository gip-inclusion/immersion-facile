import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { withAcquisitionSchema } from "../acquisition.dto";
import { addressSchema } from "../address/address.schema";
import type {
  UpdateAgencyStatusParams,
  UpdateAgencyStatusParamsWithoutId,
} from "../admin/admin.dto";
import type { Email } from "../email/email.dto";
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
  type AgencyDto,
  type AgencyDtoForAgencyUsersAndAdmins,
  type AgencyId,
  type AgencyIdResponse,
  type AgencyKind,
  type AgencyOption,
  type CreateAgencyDto,
  type ListAgencyOptionsRequestDto,
  type PrivateListAgenciesRequestDto,
  type WithAgencyDto,
  type WithAgencyId,
  type WithAgencyStatus,
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
const agencyStatusSchema = z.enum(allAgencyStatuses);

export const agencyOptionSchema: z.ZodSchema<AgencyOption> = z.object({
  id: agencyIdSchema,
  name: z.string(),
  kind: agencyKindSchema,
  status: agencyStatusSchema,
  address: addressSchema,
  refersToAgencyName: zStringMinLength1.or(z.null()),
});

export const agencyOptionsSchema: z.ZodSchema<AgencyOption[]> =
  z.array(agencyOptionSchema);

export const listAgencyOptionsRequestSchema: z.ZodSchema<ListAgencyOptionsRequestDto> =
  z.object({
    departmentCode: z.string().optional(),
    nameIncludes: z.string().optional(),
    filterKind: z.enum(agencyKindFilters).optional(),
    siret: z.string().optional(),
    status: z.array(agencyStatusSchema).optional(),
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

export const editAgencySchema: z.ZodSchema<AgencyDto> = z
  .object({ ...commonAgencyShape, ...withEmails })
  .and(
    z.object({
      status: agencyStatusSchema,
      codeSafir: zStringMinLength1.or(z.null()),
      refersToAgencyId: refersToAgencyIdSchema.or(z.null()),
      refersToAgencyName: zStringMinLength1.or(z.null()),
      rejectionJustification: zStringMinLength1.or(z.null()),
    }),
  )
  .and(withAcquisitionSchema);

const withAdminEmailsSchema: z.Schema<{ admins: Email[] }> = z.object({
  admins: z.array(emailSchema),
});

export const agencyDtoForAgencyUsersAndAdminsSchema: z.Schema<AgencyDtoForAgencyUsersAndAdmins> =
  z
    .object(commonAgencyShape)
    .merge(
      z.object({
        agencySiret: siretSchema,
        status: agencyStatusSchema,
        codeSafir: zStringMinLength1.or(z.null()),
        refersToAgencyId: refersToAgencyIdSchema.or(z.null()),
        refersToAgencyName: zStringMinLength1.or(z.null()),
        rejectionJustification: z.string().or(z.null()),
      }),
    )
    .and(withAcquisitionSchema)
    .and(withAdminEmailsSchema);

export const agencySchema: z.ZodSchema<AgencyDto> = z
  .object({ ...commonAgencyShape, ...withEmails })
  .merge(
    z.object({
      agencySiret: siretSchema,
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
