import { nafSchema } from "shared";
import { appellationSchema, romeCodeSchema } from "shared";
import { siretSchema } from "shared";
import { NotEmptyArray, phoneRegExp } from "shared";
import { addressWithPostalCodeSchema } from "shared";
import { zBoolean, zEmail, zString, zTrimmedString } from "shared";
import { z } from "zod";
import {
  BusinessContactDtoPublicV0,
  FormEstablishmentDtoPublicV0,
} from "./FormEstablishmentPublicV0.dto";

export const businessContactSchemaPublicV0: z.Schema<BusinessContactDtoPublicV0> =
  z.object({
    lastName: zTrimmedString,
    firstName: zTrimmedString,
    job: zTrimmedString,
    phone: zString.regex(phoneRegExp, "Numero de téléphone incorrect"),
    email: zEmail,
  });

export type ContactMethodPublicV0 = "UNKNOWN" | "EMAIL" | "PHONE" | "IN_PERSON";
const validContactMethodsV0: NotEmptyArray<ContactMethodPublicV0> = [
  "EMAIL",
  "PHONE",
  "IN_PERSON",
];

export type ProfessionDtoPublicV0 = {
  romeCodeMetier: string; // 5 characters respecting regex : /[A-N]\d{4}/
  romeCodeAppellation?: string; // 5 digits (regex : /\d{5}/  )
  description: string;
};

export const professionSchemaPublicV0: z.Schema<ProfessionDtoPublicV0> =
  z.object({
    romeCodeMetier: romeCodeSchema,
    romeCodeAppellation: appellationSchema.optional(),
    description: zTrimmedString,
  });

export const formEstablishmentSchemaPublicV0: z.Schema<FormEstablishmentDtoPublicV0> =
  z.object(
    {
      siret: siretSchema,
      businessName: zTrimmedString,
      businessNameCustomized: zTrimmedString.optional(),
      businessAddress: addressWithPostalCodeSchema,
      isEngagedEnterprise: zBoolean.optional(),
      naf: nafSchema.optional(),
      professions: z
        .array(professionSchemaPublicV0)
        .min(1, "Spécifiez au moins 1 métier"),
      businessContacts: z
        .array(businessContactSchemaPublicV0, {
          required_error: "Contact obligatoire",
        })
        .length(1, "Spécifiez 1 seul référent"),
      preferredContactMethods: z
        .array(z.enum(validContactMethodsV0), {
          required_error: "Mode de contact obligatoire",
        })
        .length(1, "Spécifiez un mode de contact"),
      isSearchable: zBoolean,
    },
    { required_error: "Veuillez compléter le formulaire" },
  );
