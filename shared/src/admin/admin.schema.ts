import { z } from "zod";
import { agencyIdSchema } from "../agency/agency.schema";
import { conventionIdSchema } from "../convention/convention.schema";
import { emailSchema } from "../email/email.schema";
import {
  agencyRoleSchema,
  userIdSchema,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.schema";
import { siretSchema } from "../siret/siret.schema";
import { zStringMinLength1 } from "../zodUtils";
import {
  GetUsersFilters,
  ManageConventionAdminForm,
  ManageEstablishmentAdminForm,
  RejectIcUserRoleForAgencyParams,
  RemoveAgencyUserParams,
  UserParamsForAgency,
  WithUserFilters,
} from "./admin.dto";

export const removeAgencyUserParamsSchema: z.Schema<RemoveAgencyUserParams> =
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

export const rejectIcUserRoleForAgencyParamsSchema: z.Schema<RejectIcUserRoleForAgencyParams> =
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
