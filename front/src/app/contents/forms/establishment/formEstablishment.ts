import { BusinessContactDto, FormEstablishmentDto } from "shared";
import { FormFieldsObjectForContent } from "src/app/hooks/formContents.hooks";
import { FormFieldAttributesForContent } from "../types";

type FormEstablishmentField = Partial<
  | Exclude<
      keyof FormEstablishmentDto,
      "id" | "naf" | "businessContact" | "source" | "isSearchable"
    >
  | `businessContact.${keyof BusinessContactDto}`
>;

export type FormEstablishmentFieldsLabels = FormFieldsObjectForContent<
  Record<FormEstablishmentField, FormFieldAttributesForContent>
>;

export const formEstablishmentFieldsLabels: FormEstablishmentFieldsLabels = {
  siret: {
    label: "Indiquez le SIRET de la structure d'accueil",
    id: "establishment-siret",
    required: true,
  },

  businessName: {
    label: "Vérifiez le nom (raison sociale) de votre établissement",
    id: "establishment-businessName",
    required: true,
  },
  businessNameCustomized: {
    label:
      "Indiquez le nom de l'enseigne de l'établissement d'accueil, si elle diffère de la raison sociale",
    id: "establishment-businessNameCustomized",
    autoComplete: "organization",
  },
  businessAddress: {
    label: "Vérifiez l'adresse de votre établissement",
    required: true,
    id: "establishment-businessAddress",
  },
  "businessContact.lastName": {
    label: "Nom du référent",
    required: true,
    id: "establishment-businessContact-lastName",
  },
  "businessContact.firstName": {
    label: "Prénom du référent",
    required: true,
    id: "establishment-businessContact-firstName",
  },
  "businessContact.job": {
    label: "Fonction du référent",
    required: true,
    id: "establishment-businessContact-job",
  },
  "businessContact.phone": {
    label: "Numéro de téléphone (ne sera pas communiqué directement)",
    required: true,
    id: "establishment-businessContact-phone",
  },
  "businessContact.email": {
    label: "E-mail",
    required: true,
    id: "establishment-businessContact-email",
  },
  "businessContact.copyEmails": {
    label: "Autres destinataires",
    description: "Adresses mail à mettre en copie",
    placeholder: "cc1@mail.com, cc2@mail.com",
    id: "establishment-businessContact-copyEmails",
  },
  "businessContact.contactMethod": {
    label: "Comment souhaitez-vous que les candidats vous contactent ?",
    required: true,
    id: "establishment-businessContact-contactMethod",
  },
  "businessContact.maxContactPerWeek": {
    label:
      "Au maximum, combien de mises en relation souhaitez-vous recevoir par semaine ?",
    description:
      "Par exemple, en renseignant 5 : si vous avez déjà reçu 5 demandes cette semaine, vous n'apparaîtrez plus dans la liste des entreprises accueillantes jusqu'à la semaine suivante.",
    required: false,
    id: "establishment-businessContact-maxContactPerWeek",
  },
  isEngagedEnterprise: {
    label:
      "Mon entreprise est membre de la communauté « Les entreprises s'engagent »",
    id: "establishment-isEngagedEnterprise",
  },
  fitForDisabledWorkers: {
    label:
      "Mon entreprise accueille en priorité des personnes en situation de handicap",
    id: "establishment-fitForDisabledWorkers",
  },
  appellations: {
    label: "",
    id: "establishment-appellations",
  },
  website: {
    label: "URL vers votre site internet",
    id: "establishment-website",
  },
  additionalInformation: {
    label: "Informations complémentaires",
    id: "establishment-additionalInformation",
    description:
      "En information complémentaire, nous vous conseillons de valoriser votre histoire afin de donner envie à un candidat de découvrir un métier au sein de votre établissement.",
    placeholder:
      "Ex : ma biographie d’entreprise (valeurs, écosystème, projections), mon potentiel d’embauche ou toute autre information essentielle pour l’accueil du bénéficiaire au sein de mon établissement",
  },
};
