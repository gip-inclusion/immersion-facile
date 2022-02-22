import { z } from "../../node_modules/zod";
import { NafDto, nafSchema } from "./naf";
import { ProfessionDto, professionSchema } from "./rome";
import { SiretDto, siretSchema } from "./siret";
import { Flavor } from "./typeFlavors";
import {
  addressWithPostalCodeSchema,
  NotEmptyArray,
  phoneRegExp,
} from "./utils";
import { zBoolean, zEmail, zString, zTrimmedString } from "./zodUtils";

export type FormEstablishmentId = Flavor<string, "FormEstablishmentId">;
export const formEstablishmentIdSchema: z.ZodSchema<FormEstablishmentId> =
  zTrimmedString;

// prettier-ignore
export type ImmersionContactInEstablishmentId = Flavor<string, "ImmersionContactInEstablishmentId">;
export const immersionContactInEstablishmentIdSchema: z.ZodSchema<ImmersionContactInEstablishmentId> =
  zTrimmedString;

export type BusinessContactDto = {
  lastName: string;
  firstName: string;
  job: string;
  phone: string; // we have a very permissive regex /^\+?[0-9]+$/
  email: string; // a valid email
};
export const businessContactSchema: z.Schema<BusinessContactDto> = z.object({
  lastName: zTrimmedString,
  firstName: zTrimmedString,
  job: zTrimmedString,
  phone: zString.regex(phoneRegExp, "Numero de téléphone incorrect"),
  email: zEmail,
});

export type ContactMethod = "UNKNOWN" | "EMAIL" | "PHONE" | "IN_PERSON";
const validContactMethods: NotEmptyArray<ContactMethod> = [
  "EMAIL",
  "PHONE",
  "IN_PERSON",
];
export const preferEmailContactSchema = z.literal("EMAIL");
export const preferPhoneContactSchema = z.literal("PHONE");
export const preferInPersonContactSchema = z.literal("IN_PERSON");
export const preferredContactMethodSchema = z.enum(validContactMethods);

export type FormEstablishmentDto = {
  id: FormEstablishmentId;
  siret: SiretDto; // 14 characters string
  businessName: string;
  businessNameCustomized?: string;
  businessAddress: string; // must include post code
  isEngagedEnterprise?: boolean;
  naf?: NafDto; // { code: string, nomenclature: string }
  professions: ProfessionDto[]; // at least one
  businessContacts: BusinessContactDto[]; // array of exactly one element (a bit strange but it from long ago)
  preferredContactMethods: ContactMethod[]; // array of exactly one element (a bit strange but it from long ago)
};

export const formEstablishmentSchema: z.Schema<FormEstablishmentDto> = z.object(
  {
    id: formEstablishmentIdSchema,
    siret: siretSchema,
    businessName: zTrimmedString,
    businessNameCustomized: zTrimmedString.optional(),
    businessAddress: addressWithPostalCodeSchema,
    isEngagedEnterprise: zBoolean.optional(),
    naf: nafSchema.optional(),
    professions: z
      .array(professionSchema)
      .min(1, "Spécifiez au moins 1 métier"),
    businessContacts: z
      .array(businessContactSchema, { required_error: "Obligatoire" })
      .length(1, "Spécifiez 1 seul référent"),
    preferredContactMethods: z
      .array(preferredContactMethodSchema, { required_error: "Obligatoire" })
      .length(1, "Spécifiez un mode de contact"),
  },
  { required_error: "Obligatoire" },
);
