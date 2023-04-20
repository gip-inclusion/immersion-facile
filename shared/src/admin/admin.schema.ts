import { z } from "zod";
import { agencyIdSchema } from "../agency/agency.schema";
import {
  agencyRoleSchema,
  authenticatedUserIdSchema,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.schema";
import { zTrimmedString } from "../zodUtils";
import { RegisterAgencyWithRoleToUserDto, UserAndPassword } from "./admin.dto";

export const userAndPasswordSchema: z.Schema<UserAndPassword> = z.object({
  user: zTrimmedString,
  password: zTrimmedString,
});

export const registerAgencyWithRoleToUserSchema: z.Schema<RegisterAgencyWithRoleToUserDto> =
  z.object({
    agencyId: agencyIdSchema,
    userId: authenticatedUserIdSchema,
    role: agencyRoleSchema,
  });
