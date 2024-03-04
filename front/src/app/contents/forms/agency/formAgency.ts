import { AddressDto, CreateAgencyDto, domElementIds } from "shared";
import { FormFieldsObjectForContent } from "src/app/hooks/formContents.hooks";
import { FormFieldAttributesForContent } from "../types";

export type FormAgencyFieldsLabels = FormFieldsObjectForContent<
  Record<
    Partial<
      | keyof CreateAgencyDto
      | "stepsForValidation"
      | `address.${keyof AddressDto}`
    >,
    FormFieldAttributesForContent
  >
>;

export const formAgencyFieldsLabels: FormAgencyFieldsLabels = {
  id: {
    label: "Identifiant",
    id: domElementIds.addAgency.id,
  },
  name: {
    label: "Nom de la structure",
    placeholder: "Agence de Boulogne-Billancourt",
    required: true,
    id: domElementIds.addAgency.nameInput,
    autoComplete: "organization",
  },
  coveredDepartments: {
    id: domElementIds.addAgency.coveredDepartmentsInput,
    label: "Départements couverts",
  },
  address: {
    label: "Adresse de la structure",
    required: true,
    id: domElementIds.addAgency.addressInput.address,
    placeholder: "Ex: 26 rue du labrador, 37000 Tours",
  },
  "address.city": {
    label: "Ville",
    id: domElementIds.addAgency.addressInput.city,
  },
  "address.departmentCode": {
    label: "Code de département",
    id: domElementIds.addAgency.addressInput.departmentCode,
  },
  "address.postcode": {
    label: "Code postal",
    id: domElementIds.addAgency.addressInput.postcode,
  },
  "address.streetNumberAndAddress": {
    label: "Numéro et nom de rue",
    id: domElementIds.addAgency.addressInput.streetNumberAndAddress,
  },
  position: {
    label: "Coordonnées géographiques de la structure",
    id: domElementIds.addAgency.positionInput,
  },
  logoUrl: {
    label: "Téléverser le logo de votre structure",
    id: domElementIds.addAgency.logoUrlInput,
    hintText: "Cela permet de personnaliser les mails automatisés.",
  },
  validatorEmails: {
    required: true,
    id: domElementIds.addAgency.validatorEmailsInput,
    label: "Emails de validation définitive de la demande de convention",
    placeholder: "valideur.dupont@mail.com",
    hintText:
      "Les personnes ou emails génériques suivants valideront les conventions préalablement examinées.",
  },
  signature: {
    label: "Texte de signature",
    id: domElementIds.addAgency.signatureInput,
    required: true,
    hintText:
      "Quel texte de signature souhaitez-vous pour les mails automatisés ?",
    placeholder: "L’équipe de l’agence de Boulogne-Billancourt",
  },

  kind: {
    label: "Type de structure",
    id: domElementIds.addAgency.kindSelect,
    required: true,
    placeholder: "Veuillez choisir un type de structure",
  },
  counsellorEmails: {
    id: domElementIds.addAgency.counsellorEmailsInput,
    label: "Emails pour examen préalable de la demande de convention",
    placeholder: "Ex : conseiller.dupont@mail.com",
    hintText:
      "Les personnes ou emails génériques suivants recevront en premier les demandes de convention à examiner.",
  },
  questionnaireUrl: {
    id: domElementIds.addAgency.questionnaireUrlInput,
    label: "Lien vers le document de support du bilan de fin d’immersion ",
    hintText: "Format attendu : https://mon-document.com/bilan ",
    placeholder:
      "Ex : https://docs.google.com/document/d/mon-document-pour-bilan",
  },
  agencySiret: {
    label: "SIRET de la structure",
    id: domElementIds.addAgency.agencySiretInput,
    placeholder: "n° de siret",
    required: true,
  },
  refersToAgencyId: {
    label: "Agence prescriptrice référente",
    id: domElementIds.addAgency.refersToAgencyId,
    required: true,
  },
  stepsForValidation: {
    id: domElementIds.addAgency.stepsForValidationInput,
    label: "Combien d'étapes de validation des immersions y a-t-il ?",
    required: true,
  },
};
