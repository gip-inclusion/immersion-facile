import { z } from "zod/v4";
import { agencyIdSchema, agencyRoleSchema } from "../agency/agency.schema";
import { conventionIdSchema } from "../convention/convention.schema";
import { emailSchema } from "../email/email.schema";
import { siretSchema } from "../siret/siret.schema";
import { userIdSchema } from "../user/user.schema";
import { zStringMinLength1 } from "../zodUtils";
import type {
  GetUsersFilters,
  ManageConventionAdminForm,
  ManageEstablishmentAdminForm,
  RejectConnectedUserRoleForAgencyParams,
  UserParamsForAgency,
  WithAgencyIdAndUserId,
  WithUserFilters,
} from "./admin.dto";

export const withAgencyIdAndUserIdSchema: z.Schema<WithAgencyIdAndUserId> =
  z.object({
    agencyId: agencyIdSchema,
    userId: userIdSchema,
  });

export const userParamsForAgencySchema: z.Schema<UserParamsForAgency> =
  z.object({
    agencyId: agencyIdSchema,
    userId: userIdSchema,
    roles: z.array(agencyRoleSchema),
    isNotifiedByEmail: z.boolean(),
    email: emailSchema,
  });

export const rejectIcUserRoleForAgencyParamsSchema: z.Schema<RejectConnectedUserRoleForAgencyParams> =
  z.object({
    agencyId: agencyIdSchema,
    userId: userIdSchema,
    justification: zStringMinLength1,
  });

export const withUserFiltersSchema: z.Schema<WithUserFilters> = z
  .object({
    agencyRole: agencyRoleSchema,
  })
  .or(
    z.object({
      agencyId: agencyIdSchema,
    }),
  );

export const manageConventionAdminFormSchema: z.Schema<ManageConventionAdminForm> =
  z.object({
    conventionId: conventionIdSchema,
  });

export const manageEstablishmentAdminFormSchema: z.Schema<ManageEstablishmentAdminForm> =
  z.object({
    siret: siretSchema,
  });

export const getUsersFiltersSchema: z.Schema<GetUsersFilters> = z.object({
  emailContains: z.string(),
});
