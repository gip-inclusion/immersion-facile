import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { agencySchema } from "../agency/agency.schema";
import { emailSchema } from "../email/email.schema";
import { zStringMinLength1, zTrimmedString } from "../zodUtils";
import {
  AgencyRight,
  allAgencyRoles,
  AuthenticatedUserId,
  InclusionConnectedUser,
} from "./inclusionConnectedAllowed.dto";

export const agencyRoleSchema = z.enum(allAgencyRoles);

const agencyRightSchema: z.Schema<AgencyRight> = z.object({
  agency: agencySchema,
  role: agencyRoleSchema,
});

export const authenticatedUserIdSchema: z.Schema<AuthenticatedUserId> =
  zTrimmedString;

export const inclusionConnectedUserSchema: z.Schema<InclusionConnectedUser> =
  z.object({
    id: authenticatedUserIdSchema,
    email: emailSchema,
    firstName: zStringMinLength1,
    lastName: zStringMinLength1,
    agencyRights: z.array(agencyRightSchema),
    dashboardUrl: absoluteUrlSchema.optional(),
    erroredConventionsDashboardUrl: absoluteUrlSchema.optional(),
  });
