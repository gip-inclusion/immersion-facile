import { z } from "zod";
import { localization } from "../zodUtils";
import {
  allRoles,
  allSignatoryRoles,
  type EstablishmentRole,
  establishmentsRoles,
  type Role,
  type SignatoryRole,
} from "./role.dto";

export const roleSchema: z.Schema<Role> = z.enum(allRoles, {
  error: localization.invalidEnum,
});

export const signatoryRoleSchema: z.Schema<SignatoryRole> = z.enum(
  allSignatoryRoles,
  {
    error: localization.invalidEnum,
  },
);

export const establishmentRoleSchema: z.Schema<EstablishmentRole> = z.enum(
  establishmentsRoles,
  {
    error: localization.invalidEnum,
  },
);
