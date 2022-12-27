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

const defaultProps = {
  name: "",
};

export const formEstablishmentFieldsLabels: FormEstablishmentFieldsLabels = {
  siret: {
    ...defaultProps,
    label: "Indiquez le SIRET de la structure d'accueil",
    id: "establishment-siret",
    required: true,
  },

  businessName: {
    ...defaultProps,
    label: "Vérifiez le nom (raison sociale) de votre établissement",
    id: "establishment-businessName",
    required: true,
  },
  businessNameCustomized: {
    ...defaultProps,
    label:
      "Indiquez le nom de l'enseigne de l'établissement d'accueil, si elle diffère de la raison sociale",
    id: "establishment-businessNameCustomized",
    autoComplete: "organization",
  },
  businessAddress: {
    ...defaultProps,
    label: "Vérifiez l'adresse de votre établissement",
    required: true,
    id: "establishment-businessAddress",
  },
  "businessContact.lastName": {
    ...defaultProps,
    label: "Nom du référent",
    required: true,
    id: "establishment-businessContact-lastName",
  },
  "businessContact.firstName": {
    ...defaultProps,
    label: "Prénom du référent",
    required: true,
    id: "establishment-businessContact-firstName",
  },
  "businessContact.job": {
    ...defaultProps,
    label: "Fonction du référent",
    required: true,
    id: "establishment-businessContact-job",
  },
  "businessContact.phone": {
    ...defaultProps,
    label: "Numéro de téléphone (ne sera pas communiqué directement)",
    required: true,
    id: "establishment-businessContact-phone",
  },
  "businessContact.email": {
    ...defaultProps,
    label: "Email",
    required: true,
    id: "establishment-businessContact-email",
  },
  "businessContact.copyEmails": {
    ...defaultProps,
    label: "Autres destinataires",
    description: "Adresses mail à mettre en copie",
    placeholder: "cc1@mail.com, cc2@mail.com",
    id: "establishment-businessContact-copyEmails",
  },
  "businessContact.contactMethod": {
    ...defaultProps,
    label: "Comment souhaitez-vous que les candidats vous contactent ?",
    required: true,
    id: "establishment-businessContact-contactMethod",
  },
  isEngagedEnterprise: {
    ...defaultProps,
    label:
      "Mon entreprise est membre de la communauté « Les entreprises s'engagent »",
    id: "establishment-isEngagedEnterprise",
  },
  appellations: {
    ...defaultProps,
    label: "",
    id: "establishment-appellations",
  },
  website: {
    ...defaultProps,
    label: "URL vers votre site internet",
    id: "establishment-website",
  },
  additionalInformation: {
    ...defaultProps,
    label: "Informations complémentaires",
    id: "establishment-additionalInformation",
  },
};
