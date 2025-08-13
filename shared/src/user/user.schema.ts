import z from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import type { AgencyRight, WithAgencyDashboards } from "../agency/agency.dto";
import {
  agencyDtoForAgencyUsersAndAdminsSchema,
  agencyRoleSchema,
} from "../agency/agency.schema";
import { proConnectInfoSchema } from "../auth/proConnect/proConnect.schema";
import { businessNameSchema } from "../business/business";
import { emailSchema } from "../email/email.schema";
import type {
  EstablishmentData,
  WithEstablishmentDashboards,
} from "../establishment/establishment";
import { establishmentsRoles } from "../role/role.dto";
import { siretSchema } from "../siret/siret.schema";
import { dateTimeIsoStringSchema } from "../utils/date";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zStringCanBeEmpty,
  zStringMinLength1,
} from "../zodUtils";
import type {
  ConnectedUser,
  User,
  UserId,
  UserWithNumberOfAgencies,
  WithOptionalUserId,
} from "./user.dto";

export const userIdSchema: ZodSchemaWithInputMatchingOutput<UserId> =
  zStringMinLength1;

export const withOptionalUserIdSchema: ZodSchemaWithInputMatchingOutput<WithOptionalUserId> =
  z.object({
    userId: userIdSchema.optional(),
  });

const userSchema: ZodSchemaWithInputMatchingOutput<User> = z.object({
  id: userIdSchema,
  email: emailSchema,
  createdAt: dateTimeIsoStringSchema,
  firstName: zStringCanBeEmpty,
  lastName: zStringCanBeEmpty,
  proConnect: proConnectInfoSchema.or(z.null()),
});

export const userInListSchema: ZodSchemaWithInputMatchingOutput<UserWithNumberOfAgencies> =
  userSchema.and(
    z.object({
      numberOfAgencies: z.number(),
    }),
  );

const agencyRightSchema: ZodSchemaWithInputMatchingOutput<AgencyRight> =
  z.object({
    agency: agencyDtoForAgencyUsersAndAdminsSchema,
    roles: z.array(agencyRoleSchema),
    isNotifiedByEmail: z.boolean(),
  });

const withEstablishmentSiretAndName: ZodSchemaWithInputMatchingOutput<EstablishmentData> =
  z.object({
    siret: siretSchema,
    businessName: businessNameSchema,
    role: z.enum(establishmentsRoles, {
      error: localization.invalidEnum,
    }),
    admins: z.array(
      z.object({
        firstName: zStringCanBeEmpty,
        lastName: zStringCanBeEmpty,
        email: emailSchema,
      }),
    ),
  });

const dashboardsSchema: ZodSchemaWithInputMatchingOutput<
  WithAgencyDashboards & WithEstablishmentDashboards
> = z.object({
  establishments: z.object({
    conventions: absoluteUrlSchema.optional(),
    discussions: absoluteUrlSchema.optional(),
    editEstablishment: siretSchema.optional(),
  }),
  agencies: z.object({
    agencyDashboardUrl: absoluteUrlSchema.optional(),
    erroredConventionsDashboardUrl: absoluteUrlSchema.optional(),
    statsEstablishmentDetailsUrl: absoluteUrlSchema.optional(),
    statsConventionsByEstablishmentByDepartmentUrl:
      absoluteUrlSchema.optional(),
    statsAgenciesUrl: absoluteUrlSchema.optional(),
  }),
});

export const connectedUserSchema: ZodSchemaWithInputMatchingOutput<ConnectedUser> =
  userSchema.and(
    z.object({
      agencyRights: z.array(agencyRightSchema),
      dashboards: dashboardsSchema,
      establishments: z.array(withEstablishmentSiretAndName).optional(),
      isBackofficeAdmin: z.boolean().optional(),
    }),
  );
