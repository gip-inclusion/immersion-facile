import { ImmersionOfferDto } from "src/shared/ImmersionOfferDto";

export type FieldsWithLabel = Exclude<
  keyof ImmersionOfferDto,
  "id" | "naf" | "businessContacts"
>;

export const fieldsToLabel: Record<FieldsWithLabel, string> = {
  businessAddress: "Vérifiez l'adresse de votre établissement",
  businessName: "Vérifiez le nom (raison sociale) de votre établissement",
  preferredContactMethods:
    "Comment souhaitez-vous que les candidats vous contactent ?",
  professions: "Métiers ouverts à l'immersion",
  siret: "Indiquez le SIRET de la structure d'accueil",
};
