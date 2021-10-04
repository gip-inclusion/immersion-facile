import { z } from "../../node_modules/zod";
import { nafSchema } from "./naf";
import { professionSchema } from "./rome";
import { Flavor } from "./typeFlavors";
import { NotEmptyArray, phoneRegExp } from "./utils";
import { zEmail, zRequiredString, zString } from "./zodUtils";

export type ImmersionOfferId = Flavor<string, "ImmersionOfferId">;
const immersionOfferIdSchema: z.ZodSchema<ImmersionOfferId> = zRequiredString;

export type BusinessContactDto = z.infer<typeof businessContactSchema>;
export const businessContactSchema = z.object({
  lastName: zRequiredString,
  firstName: zRequiredString,
  job: zRequiredString,
  phone: zString.regex(phoneRegExp, "Numero de téléphone incorrect"),
  email: zEmail,
});

export type ContactMethod = "UNKNOWN" | "EMAIL" | "PHONE" | "IN_PERSON";
const validContactMethods: NotEmptyArray<ContactMethod> = [
  "EMAIL",
  "PHONE",
  "IN_PERSON",
];

export type ImmersionOfferDto = z.infer<typeof immersionOfferSchema>;
export const immersionOfferSchema = z.object(
  {
    id: immersionOfferIdSchema,
    siret: zString.length(14, "SIRET doit étre composé de 14 chiffres"),
    businessName: zRequiredString,
    businessAddress: zRequiredString,
    naf: nafSchema,
    professions: z
      .array(professionSchema)
      .min(1, "Spécifiez au moins 1 métier"),
    businessContacts: z
      .array(businessContactSchema, { required_error: "Obligatoire" })
      .length(1, "Spécifiez 1 seul référent"),
    preferredContactMethods: z
      .array(z.enum(validContactMethods), { required_error: "Obligatoire" })
      .length(1, "Spécifiez un mode de contact"),
  },
  { required_error: "Obligatoire" },
);

// prettier-ignore
export type AddImmersionOfferResponseDto = z.infer<typeof addImmersionOfferResponseSchema>;
export const addImmersionOfferResponseSchema = immersionOfferIdSchema;
