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
import { phoneNumberSchema } from "../phone/phone.schema";
import { allAgencyRoles } from "../role/role.dto";
import { siretSchema } from "../siret/siret.schema";
import {
  localization,
  stringWithMaxLength255,
  type ZodSchemaWithInputMatchingOutput,
  zEnumValidation,
  zStringMinLength1,
} from "../zodUtils";
import {
  type AgencyDto,
  type AgencyDtoForAgencyUsersAndAdmins,
  type AgencyId,
  type AgencyIdResponse,
  type AgencyKind,
  type AgencyOption,
  agencyKindFilters,
  agencyKindList,
  allAgencyStatuses,
  type CreateAgencyDto,
  type CreateAgencyInitialValues,
  type ListAgencyOptionsRequestDto,
  type PrivateListAgenciesRequestDto,
  type WithAgencyDto,
  type WithAgencyId,
  type WithAgencyStatus,
} from "./agency.dto";

export const agencyIdSchema: ZodSchemaWithInputMatchingOutput<AgencyId> =
  zStringMinLength1;
export const refersToAgencyIdSchema: ZodSchemaWithInputMatchingOutput<AgencyId> =
  z.string();
export const agencyIdsSchema: ZodSchemaWithInputMatchingOutput<AgencyId[]> = z
  .array(agencyIdSchema)
  .nonempty();

export const agencyRoleSchema = z.enum(allAgencyRoles, {
  error: localization.invalidEnum,
});

export const withAgencyIdSchema: ZodSchemaWithInputMatchingOutput<WithAgencyId> =
  z.object({
    agencyId: agencyIdSchema,
  });

export const withAgencyIdSchemaPartial: ZodSchemaWithInputMatchingOutput<
  Partial<WithAgencyId>
> = z
  .object({
    agencyId: agencyIdSchema,
  })
  .partial();

export const agencyIdResponseSchema: ZodSchemaWithInputMatchingOutput<AgencyIdResponse> =
  agencyIdSchema.optional();

export const agencyKindSchema: ZodSchemaWithInputMatchingOutput<AgencyKind> =
  zEnumValidation(agencyKindList, "Ce type de structure n'est pas supporté");
const agencyStatusSchema = z.enum(allAgencyStatuses, {
  error: localization.invalidEnum,
});

export const agencyOptionSchema: ZodSchemaWithInputMatchingOutput<AgencyOption> =
  z.object({
    id: agencyIdSchema,
    name: z.string(),
    kind: agencyKindSchema,
    status: agencyStatusSchema,
    address: addressSchema,
    refersToAgencyName: zStringMinLength1.or(z.null()),
  });

export const agencyOptionsSchema: ZodSchemaWithInputMatchingOutput<
  AgencyOption[]
> = z.array(agencyOptionSchema);

export const listAgencyOptionsRequestSchema: ZodSchemaWithInputMatchingOutput<ListAgencyOptionsRequestDto> =
  z.object({
    departmentCode: z.string().optional(),
    nameIncludes: z.string().optional(),
    filterKind: z
      .enum(agencyKindFilters, {
        error: localization.invalidEnum,
      })
      .optional(),
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
  phoneNumber: phoneNumberSchema,
};

export const createAgencySchema: z.ZodType<
  CreateAgencyDto,
  CreateAgencyInitialValues
> = z
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

export const editAgencySchema: ZodSchemaWithInputMatchingOutput<AgencyDto> = z
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

const withAdminEmailsSchema: ZodSchemaWithInputMatchingOutput<{
  admins: Email[];
}> = z.object({
  admins: z.array(emailSchema),
});

export const agencyDtoForAgencyUsersAndAdminsSchema: ZodSchemaWithInputMatchingOutput<AgencyDtoForAgencyUsersAndAdmins> =
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

export const agencySchema: ZodSchemaWithInputMatchingOutput<AgencyDto> = z
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

export const withAgencySchema: ZodSchemaWithInputMatchingOutput<WithAgencyDto> =
  z.object({
    agency: agencySchema,
  });

export const privateListAgenciesRequestSchema: ZodSchemaWithInputMatchingOutput<PrivateListAgenciesRequestDto> =
  z.object({
    status: agencyStatusSchema.optional(),
  });

export const updateAgencyStatusParamsWithoutIdSchema: ZodSchemaWithInputMatchingOutput<UpdateAgencyStatusParamsWithoutId> =
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

export const updateAgencyStatusParamsSchema: ZodSchemaWithInputMatchingOutput<UpdateAgencyStatusParams> =
  updateAgencyStatusParamsWithoutIdSchema.and(z.object({ id: agencyIdSchema }));

export const withAgencyStatusSchema: ZodSchemaWithInputMatchingOutput<WithAgencyStatus> =
  z.object({
    status: agencyStatusSchema,
  });
