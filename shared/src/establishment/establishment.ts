import { z } from "zod";
import type { AbsoluteUrl } from "../AbsoluteUrl";
import type { Email } from "../email/email.dto";
import { emailSchema } from "../email/email.schema";
import type { FormEstablishmentDto } from "../formEstablishment/FormEstablishment.dto";
import type { EstablishmentRole } from "../role/role.dto";
import type { SiretDto } from "../siret/siret";
import { siretSchema } from "../siret/siret.schema";
import type { Flavor } from "../typeFlavors";
import type { UserId } from "../user/user.dto";
import { userIdSchema } from "../user/user.schema";
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

export type BusinessName = Flavor<string, "BusinessName">;
export const businessNameSchema: ZodSchemaWithInputMatchingOutput<BusinessName> =
  zStringMinLength1Max255;

export type BusinessNameCustomized = Flavor<string, "BusinessNameCustomized">;
export const customizedNameSchema: ZodSchemaWithInputMatchingOutput<BusinessNameCustomized> =
  zStringCanBeEmpty;

export type BusinessAddress = Flavor<string, "BusinessAddress">;
export const businessAddressSchema: ZodSchemaWithInputMatchingOutput<BusinessAddress> =
  zStringCanBeEmpty;

export const establishmentNameAndAdminsSchema: ZodSchemaWithInputMatchingOutput<EstablishmentNameAndAdmins> =
  z.object({
    name: zStringMinLength1Max1024,
    adminEmails: z.array(emailSchema),
  });

export type GetEstablishmentPublicOptionsByFiltersInput = {
  nameIncludes?: string;
  siret?: SiretDto;
};

export const getEstablishmentPublicOptionsByFiltersSchema: ZodSchemaWithInputMatchingOutput<GetEstablishmentPublicOptionsByFiltersInput> =
  z.object({
    nameIncludes: z.string().optional(),
    siret: z.string().optional(),
  });

export const establishmentPublicOptionSchema: ZodSchemaWithInputMatchingOutput<EstablishmentPublicOption> =
  z.object({
    businessName: businessNameSchema,
    businessNameCustomized: customizedNameSchema.optional(),
    siret: siretSchema,
    userRightIds: z.array(userIdSchema),
  });

export const establishmentPublicOptionsSchema: ZodSchemaWithInputMatchingOutput<
  EstablishmentPublicOption[]
> = z.array(establishmentPublicOptionSchema);

export type EstablishmentPublicOption = Pick<
  FormEstablishmentDto,
  "businessName" | "businessNameCustomized" | "siret"
> & {
  userRightIds: UserId[];
};

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
  conventions: AbsoluteUrl | null;
  discussions: AbsoluteUrl | null;
};

export type WithEstablishmentDashboards = {
  establishments: EstablishmentDashboards;
};


