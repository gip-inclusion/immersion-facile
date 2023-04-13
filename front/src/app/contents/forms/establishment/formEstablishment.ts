import {
  BusinessContactDto,
  domElementIds,
  FormEstablishmentDto,
} from "shared";

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
    id: domElementIds.establishment.siret,
    required: true,
  },

  businessName: {
    label: "Vérifiez le nom (raison sociale) de votre établissement",
    id: domElementIds.establishment.businessName,
    required: true,
  },
  businessNameCustomized: {
    label:
      "Indiquez le nom de l'enseigne de l'établissement d'accueil, si elle diffère de la raison sociale",
    id: domElementIds.establishment.businessNameCustomized,
    autoComplete: "organization",
    hintText:
      "Nom sous lequel vous souhaitez apparaitre dans les résultats de recherche",
    placeholder: "Ex : Nom de mon enseigne (optionnel)",
  },
  businessAddress: {
    label: "Vérifiez l'adresse de votre établissement",
    required: true,
    id: domElementIds.establishment.businessAddress,
    placeholder: "Ex : 26 rue du labrador, 37000 Tours",
  },
  "businessContact.lastName": {
    label: "Nom du référent",
    required: true,
    id: domElementIds.establishment.businessContact.lastName,
  },
  "businessContact.firstName": {
    label: "Prénom du référent",
    required: true,
    id: domElementIds.establishment.businessContact.firstName,
  },
  "businessContact.job": {
    label: "Fonction du référent",
    required: true,
    id: domElementIds.establishment.businessContact.job,
  },
  "businessContact.phone": {
    label: "Numéro de téléphone (ne sera pas communiqué directement)",
    required: true,
    id: domElementIds.establishment.businessContact.phone,
  },
  "businessContact.email": {
    label: "E-mail",
    required: true,
    id: domElementIds.establishment.businessContact.email,
  },
  "businessContact.copyEmails": {
    label: "Autres destinataires",
    hintText: "Adresses mail à mettre en copie",
    placeholder: "Ex : cc1@mail.com, cc2@mail.com (optionnel)",
    id: domElementIds.establishment.businessContact.copyEmails,
  },
  "businessContact.contactMethod": {
    label: "Comment souhaitez-vous que les candidats vous contactent ?",
    required: true,
    id: domElementIds.establishment.businessContact.contactMethod,
  },
  isEngagedEnterprise: {
    label:
      "Mon entreprise est membre de la communauté « Les entreprises s'engagent »",
    id: domElementIds.establishment.isEngagedEnterprise,
  },
  fitForDisabledWorkers: {
    label:
      "Mon entreprise accueille en priorité des personnes en situation de handicap",
    id: domElementIds.establishment.fitForDisabledWorkers,
  },
  appellations: {
    label: "",
    id: domElementIds.establishment.appellations,
  },
  website: {
    label: "URL vers votre site internet",
    id: domElementIds.establishment.website,
    placeholder: "Ex : https://mon-site-internet.fr (optionnel)",
  },
  additionalInformation: {
    label: "Informations complémentaires",
    id: domElementIds.establishment.additionalInformation,
    hintText:
      "En information complémentaire, nous vous conseillons de valoriser votre histoire afin de donner envie à un candidat de découvrir un métier au sein de votre établissement.",
    placeholder:
      "Ex : ma biographie d’entreprise (valeurs, écosystème, projections), mon potentiel d’embauche ou toute autre information essentielle pour l’accueil du bénéficiaire au sein de mon établissement (optionnel)",
  },
  maxContactsPerWeek: {
    label:
      "Au maximum, combien de mises en relation souhaitez-vous recevoir par semaine ?",
    hintText:
      "Par exemple, en renseignant 5 : si vous avez déjà reçu 5 demandes cette semaine, vous n'apparaîtrez plus dans la liste des entreprises accueillantes jusqu'à la semaine suivante.",
    required: true,
    id: domElementIds.establishment.maxContactsPerWeek,
  },
};
