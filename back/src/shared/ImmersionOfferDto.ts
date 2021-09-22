import * as Yup from "yup";
import { professionDtoSchema, romeProfessionDtoSchema } from "./rome";
import { Flavor } from "./typeFlavors";
import { phoneRegExp } from "./utils";

export type ImmersionOfferId = Flavor<string, "ImmersionOfferId">;

const businessContactDtoSchema = Yup.object({
  lastName: Yup.string().required("Obligatoire"),
  firstName: Yup.string().required("Obligatoire"),
  function: Yup.string().required("Obligatoire"),
  phone: Yup.string()
    .matches(phoneRegExp, "Numero de téléphone incorrect")
    .required("Obligatoire"),
  email: Yup.string()
    .email("Veuillez saisir une adresse e-mail valide")
    .required("Obligatoire"),
  professions: Yup.array().of(romeProfessionDtoSchema).required("Obligatoire"),
}).required();

type ContactMethod = "UNKNOWN" | "EMAIL" | "PHONE" | "IN_PERSON";
const validContactMethods: ContactMethod[] = ["EMAIL", "PHONE", "IN_PERSON"];

export const immersionOfferDtoSchema = Yup.object({
  id: Yup.mixed<ImmersionOfferId>().required("Obligatoire"),
  siret: Yup.string()
    .required("Obligatoire")
    .length(14, "SIRET doit étre composé de 14 chiffres"),
  businessName: Yup.string().required("Obligatoire"),
  businessAddress: Yup.string().required("Obligatoire"),
  businessSector: Yup.string().required("Obligatoire"),
  professions: Yup.array()
    .of(professionDtoSchema)
    .min(1, "Spécifiez au moins 1 métier")
    .required(),
  businessContacts: Yup.array()
    .of(businessContactDtoSchema)
    .min(1, "Spécifiez au moins 1 référent")
    .required(),
  preferredContactMethods: Yup.array()
    .of(Yup.mixed<ContactMethod>().oneOf(validContactMethods))
    .min(1, "Spécifiez au moins 1 mode de contact")
    .required(),
}).required();

export type ImmersionOfferDto = Yup.InferType<typeof immersionOfferDtoSchema>;

export const addImmersionOfferResponseDtoSchema =
  Yup.mixed<ImmersionOfferId>().required();

export type AddImmersionOfferResponseDto = Yup.InferType<
  typeof addImmersionOfferResponseDtoSchema
>;
