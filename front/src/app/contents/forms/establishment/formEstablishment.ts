import { BusinessContactDto, FormEstablishmentDto } from "shared";
import { FormFieldsObject } from "src/app/hooks/formContents.hooks";
import { FormFieldAttributes } from "../types";

type FormEstablishmentField = Partial<
  | Exclude<
      keyof FormEstablishmentDto,
      "id" | "naf" | "businessContact" | "source" | "isSearchable"
    >
  | `businessContact.${keyof BusinessContactDto}`
>;

export type FormEstablishmentFieldsLabels = FormFieldsObject<
  Record<FormEstablishmentField, FormFieldAttributes>
>;

export const formEstablishmentFieldsLabels: FormEstablishmentFieldsLabels = {
  siret: {
    label: "Indiquez le SIRET de la structure d'accueil",
    id: "establishment-siret",
    name: "siret",
    required: true,
  },

  businessName: {
    label: "Vérifiez le nom (raison sociale) de votre établissement",
    id: "establishment-businessName",
    name: "businessName",
    required: true,
  },
  businessNameCustomized: {
    label:
      "Indiquez le nom de l'enseigne de l'établissement d'accueil, si elle diffère de la raison sociale",
    id: "establishment-businessNameCustomized",
    name: "businessNameCustomized",
    autoComplete: "organization",
  },
  businessAddress: {
    label: "Vérifiez l'adresse de votre établissement",
    required: true,
    id: "establishment-businessAddress",
    name: "businessAddress",
  },
  "businessContact.lastName": {
    label: "Nom du référent",
    required: true,
    id: "establishment-businessContact-lastName",
    name: "businessContact.lastName",
  },
  "businessContact.firstName": {
    label: "Prénom du référent",
    required: true,
    id: "establishment-businessContact-firstName",
    name: "businessContact.firstName",
  },
  "businessContact.job": {
    label: "Fonction du référent",
    required: true,
    id: "establishment-businessContact-job",
    name: "businessContact.job",
  },
  "businessContact.phone": {
    label: "Numéro de téléphone (ne sera pas communiqué directement)",
    required: true,
    id: "establishment-businessContact-phone",
    name: "businessContact.phone",
  },
  "businessContact.email": {
    label: "Email",
    required: true,
    id: "establishment-businessContact-email",
    name: "businessContact.email",
  },
  "businessContact.copyEmails": {
    label: "Autres destinataires",
    description: "Adresses mail à mettre en copie",
    placeholder: "cc1@mail.com, cc2@mail.com",
    id: "establishment-businessContact-copyEmails",
    name: "businessContact.copyEmails",
  },
  "businessContact.contactMethod": {
    label: "Comment souhaitez-vous que les candidats vous contactent ?",
    required: true,
    id: "establishment-businessContact-contactMethod",
    name: "businessContact.contactMethod",
  },
  isEngagedEnterprise: {
    label:
      "Mon entreprise est membre de la communauté « Les entreprises s'engagent »",
    id: "establishment-isEngagedEnterprise",
    name: "isEngagedEnterprise",
  },
  appellations: {
    label: "",
    description: undefined,
    placeholder: undefined,
    id: "establishment-appellations",
    name: "appellations",
  },
  website: {
    label: "URL vers votre site internet",
    id: "establishment-website",
    name: "website",
  },
  additionalInformation: {
    label: "Informations complémentaires",
    id: "establishment-additionalInformation",
    name: "additionalInformation",
  },
};
