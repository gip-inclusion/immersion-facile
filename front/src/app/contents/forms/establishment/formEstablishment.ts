import {
  BusinessContactDto,
  ContactMethod,
  FormEstablishmentDto,
  path,
} from "shared";
import { FormField } from "../types";

type FormEstablishmentField =
  | Exclude<
      keyof Partial<FormEstablishmentDto>,
      "id" | "naf" | "businessContact" | "source" | "isSearchable"
    >
  | "businessContact";

const preferredContactMethodOptions: Array<{
  label?: string;
  value: ContactMethod;
}> = [
  {
    value: "EMAIL",
    label:
      "Par mail (la demande passera par un formulaire afin de ne pas exposer l'adresse mail)",
  },
  {
    value: "PHONE",
    label:
      "Par téléphone (seuls les candidats identifiés auront accès au numéro de téléphone)",
  },
  {
    value: "IN_PERSON",
    label: "Se présenter en personne à votre établissement",
  },
];

export const formEstablishmentFieldsLabels: Record<
  FormEstablishmentField,
  FormField | Record<keyof BusinessContactDto, FormField>
> = {
  siret: {
    label: "Indiquez le SIRET de la structure d'accueil *",

    required: true,
  },

  businessName: {
    label: "Vérifiez le nom (raison sociale) de votre établissement",
    required: true,
  },
  businessNameCustomized: {
    label:
      "Indiquez le nom de l'enseigne de l'établissement d'accueil, si elle diffère de la raison sociale",
  },
  businessAddress: {
    label: "Vérifiez l'adresse de votre établissement",
    required: true,
  },
  businessContact: {
    lastName: {
      label: "Nom du référent",
      required: true,
    },
    firstName: {
      label: "Prénom du référent",
      required: true,
    },
    job: {
      label: "Fonction du référent",
      required: true,
    },
    phone: {
      label: "Numéro de téléphone (ne sera pas communiqué directement)",
      required: true,
    },
    email: {
      label: "Email",
      required: true,
    },
    copyEmails: {
      label: "Autres destinataires",
      description: "Adresses mail à mettre en copie",
      placeholder: "cc1@mail.com, cc2@mail.com",
    },
    contactMethod: {
      label: "Comment souhaitez-vous que les candidats vous contactent ?",
      options: preferredContactMethodOptions,
      required: true,
    },
  },
  isEngagedEnterprise: {
    label:
      "Mon entreprise est membre de la communauté « Les entreprises s'engagent »",
  },
  appellations: {
    label: "",
    description: undefined,
    placeholder: undefined,
    options: undefined,
  },
  website: {
    label: "URL vers votre site internet",
  },
  additionalInformation: {
    label: "Informations complémentaires",
  },
};

export const getFieldLabel = (key: FormEstablishmentField) => {
  const { label, required } = path(key, formEstablishmentFieldsLabels);
  return `${label}${required ?? " *"}`;
};

export const formEstablishmentErrorLabels: Partial<
  Record<keyof FormEstablishmentDto, string>
> = Object.keys(formEstablishmentFieldsLabels).reduce(
  (sum, field) => ({
    ...sum,
    [field]:
      formEstablishmentFieldsLabels[field as keyof FormEstablishmentField]
        ?.label,
  }),
  {},
);
