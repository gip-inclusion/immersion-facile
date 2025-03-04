import { z } from "zod";
import {
  EstablishmentRole,
  Role,
  allRoles,
  establishmentsRoles,
} from "./role.dto";

export const roleSchema: z.Schema<Role> = z.enum(allRoles);
export const establishmentRoleSchema: z.Schema<EstablishmentRole> =
  z.enum(establishmentsRoles);
