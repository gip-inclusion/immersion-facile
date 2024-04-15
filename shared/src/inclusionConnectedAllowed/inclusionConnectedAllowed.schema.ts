import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { agencySchema } from "../agency/agency.schema";
import { discussionIdSchema } from "../discussion/discussion.schema";
import { emailSchema } from "../email/email.schema";
import { withSourcePageSchema } from "../inclusionConnect/inclusionConnect.schema";
import { establishmentsRoles } from "../role/role.dto";
import { dateTimeIsoStringSchema } from "../schedule/Schedule.schema";
import { siretSchema } from "../siret/siret.schema";
import { zStringMinLength1, zTrimmedString } from "../zodUtils";
import {
  AgencyRight,
  GetInclusionConnectLogoutUrlQueryParams,
  InclusionConnectedUser,
  UserId,
  WithAgencyDashboards,
  WithDiscussionId,
  WithEstablishmentDashboards,
  WithEstablismentsSiretAndName,
  allAgencyRoles,
} from "./inclusionConnectedAllowed.dto";

export const agencyRoleSchema = z.enum(allAgencyRoles);

const agencyRightSchema: z.Schema<AgencyRight> = z.object({
  agency: agencySchema,
  role: agencyRoleSchema,
});

export const withDiscussionSchemaId: z.Schema<WithDiscussionId> = z.object({
  discussionId: discussionIdSchema,
});

export const userIdSchema: z.Schema<UserId> = zTrimmedString;

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
    firstName: zStringMinLength1,
    lastName: zStringMinLength1,
    createdAt: dateTimeIsoStringSchema,
    agencyRights: z.array(agencyRightSchema),

    externalId: zStringMinLength1,
    dashboards: dashboardsSchema,
    establishments: z.array(withEstablishmentSiretAndName).optional(),
  });

export const getInclusionConnectLogoutUrlQueryParamsSchema: z.Schema<GetInclusionConnectLogoutUrlQueryParams> =
  withSourcePageSchema;
