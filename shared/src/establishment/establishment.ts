import { z } from "zod";
import type { AbsoluteUrl } from "../AbsoluteUrl";
import type { Email } from "../email/email.dto";
import { emailSchema } from "../email/email.schema";
import type {
  EstablishmentUserRightStatus,
  FormEstablishmentDto,
  FormEstablishmentPendingUserRight,
} from "../formEstablishment/FormEstablishment.dto";
import { formEstablishmentPendingUserRightSchema } from "../formEstablishment/FormEstablishment.schema";
import type { EstablishmentRole } from "../role/role.dto";
import type { SiretDto } from "../siret/siret";
import { siretSchema } from "../siret/siret.schema";
import { zStringMinLength1Max1024 } from "../utils/string.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import {
  type BusinessName,
  businessNameSchema,
  customizedNameSchema,
} from "./businessName";

export type EstablishmentNameAndAdmins = {
  name: string;
  adminEmails: Email[];
};

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
  });

export const establishmentPublicOptionsSchema: ZodSchemaWithInputMatchingOutput<
  EstablishmentPublicOption[]
> = z.array(establishmentPublicOptionSchema);

export const registerUserOnEstablishmentPayloadSchema: ZodSchemaWithInputMatchingOutput<RegisterUserOnEstablishmentPayload> =
  z.object({
    siret: siretSchema,
    userRight: formEstablishmentPendingUserRightSchema,
  });

export type RegisterUserOnEstablishmentPayload = {
  siret: SiretDto;
  userRight: FormEstablishmentPendingUserRight;
};

export type EstablishmentPublicOption = Pick<
  FormEstablishmentDto,
  "businessName" | "businessNameCustomized" | "siret"
>;

export type EstablishmentAdminPrivateData = {
  firstName: string;
  lastName: string;
  email: Email;
};

export type UserEstablishmentRightDetails = {
  siret: SiretDto;
  businessName: BusinessName;
  role: EstablishmentRole;
  status: EstablishmentUserRightStatus;
  admins: EstablishmentAdminPrivateData[];
};

export type WithEstablishmentsData = {
  establishments?: UserEstablishmentRightDetails[];
};

export type EstablishmentDashboards = {
  conventions: AbsoluteUrl | null;
  discussions: AbsoluteUrl | null;
};

export type WithEstablishmentDashboards = {
  establishments: EstablishmentDashboards;
};
