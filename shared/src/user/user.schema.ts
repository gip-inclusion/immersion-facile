import z from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import type { AgencyRight, WithAgencyDashboards } from "../agency/agency.dto";
import {
  agencyDtoForAgencyUsersAndAdminsSchema,
  agencyRoleSchema,
} from "../agency/agency.schema";
import { proConnectInfoSchema } from "../auth/proConnect/proConnect.schema";
import { emailSchema } from "../email/email.schema";
import {
  businessNameSchema,
  type EstablishmentData,
  type WithEstablishmentDashboards,
} from "../establishment/establishment";
import { establishmentsRoles } from "../role/role.dto";
import { siretSchema } from "../siret/siret.schema";
import { dateTimeIsoStringSchema } from "../utils/date";
import {
  makeHardenedStringSchema,
  zStringCanBeEmpty,
  zStringMinLength1,
} from "../utils/string.schema";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import type {
  ConnectedUser,
  Firstname,
  FirstnameMandatory,
  Lastname,
  LastnameMandatory,
  User,
  UserId,
  UserWithNumberOfAgenciesAndEstablishments,
  WithOptionalUserId,
  WithUserId,
} from "./user.dto";

export const userIdSchema: ZodSchemaWithInputMatchingOutput<UserId> =
  zStringMinLength1;

export const withUserIdSchema: ZodSchemaWithInputMatchingOutput<WithUserId> =
  z.object({
    userId: userIdSchema,
  });

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

export const userInListSchema: ZodSchemaWithInputMatchingOutput<UserWithNumberOfAgenciesAndEstablishments> =
  userSchema.and(
    z.object({
      numberOfAgencies: z.number(),
      numberOfEstablishments: z.number(),
    }),
  );

const makePersonNameSchema = (
  fieldName: "firstname" | "lastname",
  mandatory: boolean,
) => {
  const label = fieldName === "firstname" ? "prénom" : "nom";
  return makeHardenedStringSchema({
    max: 50,
    maxMessage: `Le ${label} ne doit pas dépasser 50 caractères`,
    isEmptyAllowed: mandatory ? undefined : true,
    withRegExp: {
      regex: /^[A-Za-zÀ-ÿ\s'-]*$/,
      message: `Le ${label} ne peut contenir que des lettres, espaces, tirets et apostrophes`,
    },
  }).transform((val) => val.replace(/\s+/g, " "));
};

export const firstnameSchema: ZodSchemaWithInputMatchingOutput<Firstname> =
  makePersonNameSchema("firstname", false);
export const firstnameMandatorySchema: ZodSchemaWithInputMatchingOutput<FirstnameMandatory> =
  makePersonNameSchema("firstname", true);

export const lastnameSchema: ZodSchemaWithInputMatchingOutput<Lastname> =
  makePersonNameSchema("lastname", false);
export const lastnameMandatorySchema: ZodSchemaWithInputMatchingOutput<LastnameMandatory> =
  makePersonNameSchema("lastname", true);

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
