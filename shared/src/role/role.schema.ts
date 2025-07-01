import { z } from "zod";
import {
  allRoles,
  allSignatoryRoles,
  type EstablishmentRole,
  establishmentsRoles,
  type Role,
  type SignatoryRole,
} from "./role.dto";

export const roleSchema: z.Schema<Role> = z.enum(allRoles);

export const signatoryRoleSchema: z.Schema<SignatoryRole> =
  z.enum(allSignatoryRoles);

export const establishmentRoleSchema: z.Schema<EstablishmentRole> =
  z.enum(establishmentsRoles);
