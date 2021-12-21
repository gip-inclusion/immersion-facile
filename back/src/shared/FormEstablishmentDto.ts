import { z } from "../../node_modules/zod";
import { nafSchema } from "./naf";
import { professionSchema } from "./rome";
import { siretSchema } from "./siret";
import { Flavor } from "./typeFlavors";
import {
  addressWithPostalCodeSchema,
  NotEmptyArray,
  phoneRegExp,
} from "./utils";
import { zEmail, zString, zTrimmedString } from "./zodUtils";

export type FormEstablishmentId = Flavor<string, "FormEstablishmentId">;
export const formEstablishmentIdSchema: z.ZodSchema<FormEstablishmentId> =
  zTrimmedString;

// prettier-ignore
export type ImmersionContactInEstablishmentId = Flavor<string, "ImmersionContactInEstablishmentId">;
export const immersionContactInEstablishmentIdSchema: z.ZodSchema<ImmersionContactInEstablishmentId> =
  zTrimmedString;

export type BusinessContactDto = z.infer<typeof businessContactSchema>;
export const businessContactSchema = z.object({
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
export const preferredContactMethodSchema = z.enum(validContactMethods);

export type FormEstablishmentDto = z.infer<typeof formEstablishmentSchema>;
export const formEstablishmentSchema = z.object(
  {
    id: formEstablishmentIdSchema,
    siret: siretSchema,
    businessName: zTrimmedString,
    businessNameCustomized: zTrimmedString.optional(),
    businessAddress: addressWithPostalCodeSchema,
    naf: nafSchema,
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

// prettier-ignore
export type AddFormEstablishmentResponseDto = z.infer<typeof addFormEstablishmentResponseSchema>;
export const addFormEstablishmentResponseSchema = formEstablishmentIdSchema;
