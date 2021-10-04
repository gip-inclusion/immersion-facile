import * as Yup from "../../node_modules/yup";
import { nafSchema } from "./naf";
import { professionSchema } from "./rome";
import { Flavor } from "./typeFlavors";
import { phoneRegExp } from "./utils";

export type ImmersionOfferId = Flavor<string, "ImmersionOfferId">;

export const businessContactSchema = Yup.object({
  lastName: Yup.string().required("Obligatoire"),
  firstName: Yup.string().required("Obligatoire"),
  job: Yup.string().required("Obligatoire"),
  phone: Yup.string()
    .matches(phoneRegExp, "Numero de téléphone incorrect")
    .required("Obligatoire"),
  email: Yup.string()
    .email("Veuillez saisir une adresse e-mail valide")
    .required("Obligatoire"),
}).required("Obligatoire");

export type BusinessContactDto = Yup.InferType<typeof businessContactSchema>;

export type ContactMethod = "UNKNOWN" | "EMAIL" | "PHONE" | "IN_PERSON";
const validContactMethods: ContactMethod[] = ["EMAIL", "PHONE", "IN_PERSON"];

export type ImmersionOfferDto = Yup.InferType<typeof immersionOfferSchema>;

export const immersionOfferSchema = Yup.object({
  id: Yup.mixed<ImmersionOfferId>()
    .required("Obligatoire")
    .test("no-empty-id", "L'ID est obligatoire", (value) => {
      if (typeof value !== "string") return false;
      return value.trim() !== "";
    }),
  siret: Yup.string()
    .required("Obligatoire")
    .length(14, "SIRET doit étre composé de 14 chiffres"),
  businessName: Yup.string().required("Obligatoire"),
  businessAddress: Yup.string().required("Obligatoire"),
  naf: nafSchema,
  professions: Yup.array()
    .of(professionSchema)
    .min(1, "Spécifiez au moins 1 métier")
    .required("Obligatoire"),
  businessContacts: Yup.array()
    .of(businessContactSchema)
    .min(1, "Spécifiez au moins 1 référent")
    .max(1, "Pas plus de 1 référent")
    .required("Obligatoire"),
  preferredContactMethods: Yup.array()
    .of(Yup.mixed<ContactMethod>().oneOf(validContactMethods))
    .min(1, "Spécifiez au moins 1 mode de contact")
    .max(1, "Spécifiez au plus 1 mode de contact")
    .required("Obligatoire"),
}).required("Obligatoire");

export const addImmersionOfferResponseSchema =
  Yup.mixed<ImmersionOfferId>().required("Obligatoire");

export type AddImmersionOfferResponseDto = Yup.InferType<
  typeof addImmersionOfferResponseSchema
>;
