import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { agencyWithoutEmailSchema } from "../agency/agency.schema";
import { discussionIdSchema } from "../discussion/discussion.schema";
import { emailSchema } from "../email/email.schema";
import { IdToken } from "../inclusionConnect/inclusionConnect.dto";
import { establishmentsRoles } from "../role/role.dto";
import { dateTimeIsoStringSchema } from "../schedule/Schedule.schema";
import { siretSchema } from "../siret/siret.schema";
import { zStringCanBeEmpty, zStringMinLength1 } from "../zodUtils";
import {
  AgencyRight,
  InclusionConnectedUser,
  User,
  UserId,
  UserInList,
  WithAgencyDashboards,
  WithDiscussionId,
  WithEstablishmentDashboards,
  WithEstablismentsSiretAndName,
  WithOptionalUserId,
  allAgencyRoles,
} from "./inclusionConnectedAllowed.dto";

export const agencyRoleSchema = z.enum(allAgencyRoles);

const agencyRightSchema: z.Schema<AgencyRight> = z.object({
  agency: agencyWithoutEmailSchema,
  roles: z.array(agencyRoleSchema),
  isNotifiedByEmail: z.boolean(),
});

export const withDiscussionSchemaId: z.Schema<WithDiscussionId> = z.object({
  discussionId: discussionIdSchema,
});

export const userIdSchema: z.Schema<UserId> = zStringMinLength1;

export const withOptionalUserIdSchema: z.Schema<WithOptionalUserId> = z.object({
  userId: userIdSchema.optional(),
});

const withEstablishmentSiretAndName: z.Schema<WithEstablismentsSiretAndName> =
  z.object({
    siret: siretSchema,
    businessName: zStringMinLength1,
  });

const dashboardsSchema: z.Schema<
  WithAgencyDashboards & WithEstablishmentDashboards
> = z.object({
  establishments: z.object({
    conventions: z
      .object({
        url: absoluteUrlSchema,
        role: z.enum(establishmentsRoles),
      })
      .optional(),
    discussions: absoluteUrlSchema.optional(),
    editEstablishment: siretSchema.optional(),
  }),
  agencies: z.object({
    agencyDashboardUrl: absoluteUrlSchema.optional(),
    erroredConventionsDashboardUrl: absoluteUrlSchema.optional(),
  }),
});

const userSchema: z.Schema<User> = z.object({
  id: userIdSchema,
  email: emailSchema,
  createdAt: dateTimeIsoStringSchema,
  firstName: zStringCanBeEmpty,
  lastName: zStringCanBeEmpty,
  externalId: zStringCanBeEmpty.or(z.null()),
});

export const userInListSchema: z.Schema<UserInList> = userSchema.and(
  z.object({
    numberOfAgencies: z.number(),
  }),
);

export const inclusionConnectedUserSchema: z.Schema<InclusionConnectedUser> =
  userSchema.and(
    z.object({
      agencyRights: z.array(agencyRightSchema),
      dashboards: dashboardsSchema,
      establishments: z.array(withEstablishmentSiretAndName).optional(),
      isBackofficeAdmin: z.boolean().optional(),
    }),
  );

export type WithIdToken = {
  idToken: IdToken;
};

export const withIdTokenSchema: z.Schema<WithIdToken> = z.object({
  idToken: z.string(),
});
