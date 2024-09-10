import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { agencySchema } from "../agency/agency.schema";
import { discussionIdSchema } from "../discussion/discussion.schema";
import { emailSchema } from "../email/email.schema";
import { establishmentsRoles } from "../role/role.dto";
import { dateTimeIsoStringSchema } from "../schedule/Schedule.schema";
import { siretSchema } from "../siret/siret.schema";
import { zStringCanBeEmpty, zStringMinLength1 } from "../zodUtils";
import {
  AgencyRight,
  InclusionConnectedUser,
  UserId,
  WithAgencyDashboards,
  WithDiscussionId,
  WithEstablishmentDashboards,
  WithEstablismentsSiretAndName,
  allAgencyRoles,
} from "./inclusionConnectedAllowed.dto";
import { IdToken } from "../inclusionConnect/inclusionConnect.dto";

export const agencyRoleSchema = z.enum(allAgencyRoles);

const agencyRightSchema: z.Schema<AgencyRight> = z.object({
  agency: agencySchema,
  roles: z.array(agencyRoleSchema),
  isNotifiedByEmail: z.boolean(),
});

export const withDiscussionSchemaId: z.Schema<WithDiscussionId> = z.object({
  discussionId: discussionIdSchema,
});

export const userIdSchema: z.Schema<UserId> = zStringMinLength1;

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

export const inclusionConnectedUserSchema: z.Schema<InclusionConnectedUser> =
  z.object({
    id: userIdSchema,
    email: emailSchema,
    createdAt: dateTimeIsoStringSchema,
    agencyRights: z.array(agencyRightSchema),
    firstName: zStringCanBeEmpty,
    lastName: zStringCanBeEmpty,
    externalId: zStringCanBeEmpty.or(z.null()),
    dashboards: dashboardsSchema,
    establishments: z.array(withEstablishmentSiretAndName).optional(),
    isBackofficeAdmin: z.boolean().optional(),
  });

export type WithIdToken = {
  idToken: IdToken;
};

export const withIdTokenSchema: z.Schema<WithIdToken> = z.object({
  idToken: z.string(),
});
