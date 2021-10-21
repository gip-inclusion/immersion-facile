import { z } from "../../node_modules/zod";
import { nafSchema } from "./naf";
import { professionSchema } from "./rome";
import { siretSchema } from "./siret";
import { Flavor } from "./typeFlavors";
import { NotEmptyArray, phoneRegExp } from "./utils";
import { zEmail, zString, zTrimmedString } from "./zodUtils";

export type ImmersionOfferId = Flavor<string, "ImmersionOfferId">;
export const immersionOfferIdSchema: z.ZodSchema<ImmersionOfferId> =
  zTrimmedString;

export type ImmersionContactInEstablishmentId = Flavor<
  string,
  "ImmersionContactInEstablishmentId"
>;
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

export type ImmersionOfferDto = z.infer<typeof immersionOfferSchema>;
export const immersionOfferSchema = z.object(
  {
    id: immersionOfferIdSchema,
    siret: siretSchema,
    businessName: zTrimmedString,
    businessAddress: zTrimmedString,
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
