import { z } from "zod";
import {
  type Role,
  type SignatoryRole,
  allRoles,
  allSignatoryRoles,
} from "./role.dto";

export const roleSchema: z.Schema<Role> = z.enum(allRoles);

export const signatoryRoleSchema: z.Schema<SignatoryRole> =
  z.enum(allSignatoryRoles);
