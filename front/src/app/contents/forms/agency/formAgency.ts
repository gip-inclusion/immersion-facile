import { AddressDto, AgencyDto } from "shared";
import { FormFieldsObjectForContent } from "src/app/hooks/formContents.hooks";
import { FormFieldAttributesForContent } from "../types";

export type FormAgencyFieldsLabels = FormFieldsObjectForContent<
  Record<
    Partial<
      keyof AgencyDto | "stepsForValidation" | `address.${keyof AddressDto}`
    >,
    FormFieldAttributesForContent
  >
>;

export const formAgencyFieldsLabels: FormAgencyFieldsLabels = {
  id: {
    label: "Identifiant",
    id: "agency-id",
  },
  name: {
    label: "Nom de l'organisme",
    placeholder: "Agence de Boulogne-Billancourt",
    required: true,
    id: "agency-name",
    autoComplete: "organization",
  },
  address: {
    label: "Adresse de la structure",
    required: true,
    id: "agency-address",
    placeholder: "Ex: 26 rue du labrador, 37000 Tours",
  },
  "address.city": {
    label: "Ville",
    id: "agency-address-city",
  },
  "address.departmentCode": {
    label: "Code de département",
    id: "agency-address-departementCode",
  },
  "address.postcode": {
    label: "Code postal",
    id: "agency-address-postCode",
  },
  "address.streetNumberAndAddress": {
    label: "Numéro et nom de rue",
    id: "agency-address-streetNumberAndAddress",
  },
  position: {
    label: "Coordonnées géographiques de l'organisme",
    id: "agency-position",
  },
  logoUrl: {
    label: "Téléverser le logo de votre organisme",
    id: "agency-logoUrl",
    description: "Cela permet de personnaliser les mails automatisés.",
  },
  validatorEmails: {
    required: true,
    id: "agency-validator-emails",
    label: "Emails de validation définitive de la demande de convention",
    placeholder: "valideur.dupont@mail.com",
    description:
      "Les personnes ou emails génériques suivants valideront les conventions préalablement examinées.",
  },
  adminEmails: {
    label: "Emails des administrateurs de la structure",
    id: "agency-adminEmails",
  },
  signature: {
    label: "Texte de signature",
    id: "agency-signature",
    required: true,
    description:
      "Quel texte de signature souhaitez-vous pour les mails automatisés ?",
    placeholder: "L’équipe de l’agence de Boulogne-Billancourt",
  },
  status: {
    label: "Statut de la structure",
    id: "agency-status",
  },
  kind: {
    label: "Type de structure",
    id: "agency-kind",
    required: true,
    placeholder: "Veuillez choisir un type de structure",
  },
  counsellorEmails: {
    id: "agency-counsellor-emails",
    label: "Emails pour examen préalable de la demande de convention",
    placeholder: "conseiller.dupont@mail.com",
    description:
      "Les personnes ou emails génériques suivants recevront en premier les demandes de convention à examiner.",
  },
  codeSafir: {
    label: "Code SAFIR",
    id: "agency-codeSafir",
  },
  questionnaireUrl: {
    id: "agency-questionnaireUrl",
    label: "Lien vers le document de support du bilan de fin d’immersion ",
    placeholder: "https://docs.google.com/document/d/mon-document-pour-bilan",
  },
  agencySiret: {
    label: "SIRET de la structure",
    id: "agency-agencySiret",
  },
  stepsForValidation: {
    id: "steps-for-validation",
    label: "Combien d'étapes de validation des immersions y a-t-il ? *",
  },
};
