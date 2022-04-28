import { FormEstablishmentDto } from "src/shared/formEstablishment/FormEstablishment.dto";

export type FieldsWithLabel = Exclude<
  keyof FormEstablishmentDto,
  "id" | "naf" | "businessContact" | "source" | "isSearchable"
>;

export const fieldsToLabel: Record<FieldsWithLabel, string> = {
  businessAddress: "Vérifiez l'adresse de votre établissement",
  businessName: "Vérifiez le nom (raison sociale) de votre établissement",
  businessNameCustomized:
    "Indiquez le nom de l'enseigne de l'établissement d'accueil, si elle diffère de la raison sociale",
  appellations: "Métiers ouverts à l'immersion",
  siret: "Indiquez le SIRET de la structure d'accueil",
  isEngagedEnterprise:
    "Mon entreprise est membre de la communauté « Les entreprises s'engagent »",
};
