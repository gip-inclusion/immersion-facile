import { z } from "zod";
import { agencyIdSchema, agencyRoleSchema } from "../agency/agency.schema";
import { conventionIdSchema } from "../convention/convention.schema";
import { emailSchema } from "../email/email.schema";
import { siretSchema } from "../siret/siret.schema";
import { userIdSchema } from "../user/user.schema";
import { zStringMinLength1 } from "../utils/string.schema";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import type {
  GetUsersFilters,
  ManageConventionAdminForm,
  ManageEstablishmentAdminForm,
  RejectConnectedUserRoleForAgencyParams,
  UserParamsForAgency,
  WithAgencyIdAndUserId,
  WithUserFilters,
} from "./admin.dto";

export const withAgencyIdAndUserIdSchema: ZodSchemaWithInputMatchingOutput<WithAgencyIdAndUserId> =
  z.object({
    agencyId: agencyIdSchema,
    userId: userIdSchema,
  });

export const userParamsForAgencySchema: ZodSchemaWithInputMatchingOutput<UserParamsForAgency> =
  z.object({
    agencyId: agencyIdSchema,
    userId: userIdSchema,
    roles: z
      .array(agencyRoleSchema)
      .min(1, { message: localization.atLeastOneRole }),
    isNotifiedByEmail: z.boolean(),
    email: emailSchema,
  });

export const rejectIcUserRoleForAgencyParamsSchema: ZodSchemaWithInputMatchingOutput<RejectConnectedUserRoleForAgencyParams> =
  z.object({
    agencyId: agencyIdSchema,
    userId: userIdSchema,
    justification: zStringMinLength1,
  });

export const withUserFiltersSchema: ZodSchemaWithInputMatchingOutput<WithUserFilters> =
  z
    .object({
      agencyRole: agencyRoleSchema,
    })
    .or(
      z.object({
        agencyId: agencyIdSchema,
      }),
    );

export const manageConventionAdminFormSchema: ZodSchemaWithInputMatchingOutput<ManageConventionAdminForm> =
  z.object({
    conventionId: conventionIdSchema,
  });

export const manageEstablishmentAdminFormSchema: ZodSchemaWithInputMatchingOutput<ManageEstablishmentAdminForm> =
  z.object({
    siret: siretSchema,
  });

export const getUsersFiltersSchema: ZodSchemaWithInputMatchingOutput<GetUsersFilters> =
  z.object({
    emailContains: z.string(),
  });
