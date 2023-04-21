import { z } from "zod";
import { agencyIdSchema } from "../agency/agency.schema";
import {
  agencyRoleSchema,
  authenticatedUserIdSchema,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.schema";
import { zTrimmedString } from "../zodUtils";
import {
  IcUserRoleForAgencyParams,
  UserAndPassword,
  WithAgencyRole,
} from "./admin.dto";

export const userAndPasswordSchema: z.Schema<UserAndPassword> = z.object({
  user: zTrimmedString,
  password: zTrimmedString,
});

export const icUserRoleForAgencyParamsSchema: z.Schema<IcUserRoleForAgencyParams> =
  z.object({
    agencyId: agencyIdSchema,
    userId: authenticatedUserIdSchema,
    role: agencyRoleSchema,
  });

export const withAgencyRoleSchema: z.Schema<WithAgencyRole> = z.object({
  agencyRole: agencyRoleSchema,
});
