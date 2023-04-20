import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { agencyIdSchema, agencySchema } from "../agency/agency.schema";
import { zEmail, zString, zTrimmedString } from "../zodUtils";
import {
  AgencyRight,
  allAgencyRoles,
  AuthenticatedUserId,
  InclusionConnectedUser,
  WithAgencyIds,
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
    email: zEmail,
    firstName: zString,
    lastName: zString,
    agencyRights: z.array(agencyRightSchema),
    dashboardUrl: absoluteUrlSchema.optional(),
  });

export const withAgencyIdsSchema: z.Schema<WithAgencyIds> = z.object({
  agencies: z.array(agencyIdSchema).nonempty(),
});
