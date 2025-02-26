import { z } from "zod";
import { Role, SignatoryRole, allRoles, allSignatoryRoles } from "./role.dto";

export const roleSchema: z.Schema<Role> = z.enum(allRoles);

export const signatoryRoleSchema: z.Schema<SignatoryRole> =
  z.enum(allSignatoryRoles);
