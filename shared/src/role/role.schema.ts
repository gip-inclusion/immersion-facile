import { z } from "zod";
import {
  type EstablishmentRole,
  type Role,
  type SignatoryRole,
  allRoles,
  allSignatoryRoles,
  establishmentsRoles,
} from "./role.dto";

export const roleSchema: z.Schema<Role> = z.enum(allRoles);

export const signatoryRoleSchema: z.Schema<SignatoryRole> =
  z.enum(allSignatoryRoles);

export const establishmentRoleSchema: z.Schema<EstablishmentRole> =
  z.enum(establishmentsRoles);
