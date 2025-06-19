import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { agencyDtoForAgencyUsersAndAdminsSchema } from "../agency/agency.schema";
import { discussionIdSchema } from "../discussion/discussion.schema";
import { emailSchema } from "../email/email.schema";
import type { IdToken } from "../inclusionConnect/inclusionConnect.dto";
import { establishmentsRoles } from "../role/role.dto";
import { siretSchema } from "../siret/siret.schema";
import { dateTimeIsoStringSchema } from "../utils/date";
import { zStringCanBeEmpty, zStringMinLength1 } from "../zodUtils";
import {
  type AgencyRight,
  allAgencyRoles,
  type InclusionConnectedUser,
  type ProConnectInfos,
  type User,
  type UserId,
  type UserInList,
  type WithAgencyDashboards,
  type WithDiscussionId,
  type WithEstablishmentDashboards,
  type WithEstablishmentData,
  type WithOptionalUserId,
} from "./inclusionConnectedAllowed.dto";

export const agencyRoleSchema = z.enum(allAgencyRoles);

const agencyRightSchema: z.Schema<AgencyRight> = z.object({
  agency: agencyDtoForAgencyUsersAndAdminsSchema,
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

const withEstablishmentSiretAndName: z.Schema<WithEstablishmentData> = z.object(
  {
    siret: siretSchema,
    businessName: zStringMinLength1,
    role: z.enum(establishmentsRoles),
    admins: z.array(
      z.object({
        firstName: zStringCanBeEmpty,
        lastName: zStringCanBeEmpty,
        email: emailSchema,
      }),
    ),
  },
);

const dashboardsSchema: z.Schema<
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
  }),
});

const proConnectInfoSchema: z.Schema<ProConnectInfos> = z.object({
  externalId: zStringCanBeEmpty, // Si proConnecté et donc externalId fourni, alors pourquoi chaine vide?
  siret: siretSchema,
});

const userSchema: z.Schema<User> = z.object({
  id: userIdSchema,
  email: emailSchema,
  createdAt: dateTimeIsoStringSchema,
  firstName: zStringCanBeEmpty,
  lastName: zStringCanBeEmpty,
  proConnect: proConnectInfoSchema.or(z.null()),
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
