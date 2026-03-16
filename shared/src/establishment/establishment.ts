import { z } from "zod";
import type { AbsoluteUrl } from "../AbsoluteUrl";
import type { Email } from "../email/email.dto";
import { emailSchema } from "../email/email.schema";
import type { EstablishmentRole } from "../role/role.dto";
import type { SiretDto } from "../siret/siret";
import type { Flavor } from "../typeFlavors";
import {
  zStringCanBeEmpty,
  zStringMinLength1Max255,
  zStringMinLength1Max1024,
} from "../utils/string.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";

export type EstablishmentNameAndAdmins = {
  name: string;
  adminEmails: Email[];
};

export const establishmentNameAndAdminsSchema: ZodSchemaWithInputMatchingOutput<EstablishmentNameAndAdmins> =
  z.object({
    name: zStringMinLength1Max1024,
    adminEmails: z.array(emailSchema),
  });

export type EstablishmentAdminPrivateData = {
  firstName: string;
  lastName: string;
  email: Email;
};

export type EstablishmentData = {
  siret: SiretDto;
  businessName: BusinessName;
  role: EstablishmentRole;
  admins: EstablishmentAdminPrivateData[];
};

export type WithEstablishmentsData = {
  establishments?: EstablishmentData[];
};

export type EstablishmentDashboards = {
  conventions?: AbsoluteUrl;
  discussions?: AbsoluteUrl;
};

export type WithEstablishmentDashboards = {
  establishments: EstablishmentDashboards;
};

export type BusinessName = Flavor<string, "BusinessName">;
export const businessNameSchema: ZodSchemaWithInputMatchingOutput<BusinessName> =
  zStringMinLength1Max255;

export type BusinessNameCustomized = Flavor<string, "BusinessNameCustomized">;
export const customizedNameSchema: ZodSchemaWithInputMatchingOutput<BusinessNameCustomized> =
  zStringCanBeEmpty;

export type BusinessAddress = Flavor<string, "BusinessAddress">;
export const businessAddressSchema: ZodSchemaWithInputMatchingOutput<BusinessAddress> =
  zStringCanBeEmpty;
