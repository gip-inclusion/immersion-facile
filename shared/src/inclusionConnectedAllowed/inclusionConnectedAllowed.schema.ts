import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { agencySchema } from "../agency/agency.schema";
import { discussionIdSchema } from "../discussion/discussion.schema";
import { emailSchema } from "../email/email.schema";
import { formEstablishmentSchema } from "../formEstablishment/FormEstablishment.schema";
import { withSourcePageSchema } from "../inclusionConnect/inclusionConnect.schema";
import { establishmentsRoles } from "../role/role.dto";
import { siretSchema } from "../siret/siret.schema";
import { zStringMinLength1, zTrimmedString } from "../zodUtils";
import {
  AgencyRight,
  GetInclusionConnectLogoutUrlQueryParams,
  InclusionConnectedUser,
  UserId,
  WithDiscussionId,
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

export const inclusionConnectedUserSchema: z.Schema<InclusionConnectedUser> =
  z.object({
    id: userIdSchema,
    email: emailSchema,
    firstName: zStringMinLength1,
    lastName: zStringMinLength1,
    agencyRights: z.array(agencyRightSchema),
    agencyDashboardUrl: absoluteUrlSchema.optional(),
    erroredConventionsDashboardUrl: absoluteUrlSchema.optional(),
    externalId: zStringMinLength1,
    establishmentDashboards: z.object({
      conventions: z
        .object({
          url: absoluteUrlSchema,
          role: z.enum(establishmentsRoles),
        })
        .optional(),
      discussions: absoluteUrlSchema.optional(),
      editEstablishment: siretSchema.optional(),
    }),
    establishments: z.array(formEstablishmentSchema).optional(),
  });

export const getInclusionConnectLogoutUrlQueryParamsSchema: z.Schema<GetInclusionConnectLogoutUrlQueryParams> =
  withSourcePageSchema;
