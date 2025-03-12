import {
  type BusinessContactDto,
  type FormEstablishmentDto,
  type SiretDto,
  domElementIds,
  immersionFacileContactEmail,
} from "shared";
import type { Mode } from "src/app/components/forms/establishment/EstablishmentForm";
import type { FormFieldsObjectForContent } from "src/app/hooks/formContents.hooks";
import type { FormFieldAttributesForContent } from "../types";

type FormEstablishmentFieldKeys =
  | Exclude<
      keyof FormEstablishmentDto,
      "id" | "naf" | "businessContact" | "source" | "isSearchable"
    >
  | `businessContact.${keyof BusinessContactDto}`
  | "maxContactsPerMonthWhenAvailable";

type FormEstablishmentField = Partial<FormEstablishmentFieldKeys>;

export type FormEstablishmentFieldsLabels = FormFieldsObjectForContent<
  Record<FormEstablishmentField, FormFieldAttributesForContent>
>;

export const formEstablishmentFieldsLabels = (
  mode: Mode,
): FormEstablishmentFieldsLabels => ({
  siret: {
    label: "Indiquez le SIRET de la structure d'accueil",
    id: domElementIds.establishment[mode].siret,
    required: true,
  },

  businessName: {
    label: "Vérifiez le nom (raison sociale) de votre établissement",
    id: domElementIds.establishment[mode].businessName,
    required: true,
  },
  businessNameCustomized: {
    label:
      "Indiquez le nom de l'enseigne de l'établissement d'accueil, si elle diffère de la raison sociale",
    id: domElementIds.establishment[mode].businessNameCustomized,
    autoComplete: "organization",
    hintText:
      "Nom sous lequel vous souhaitez apparaitre dans les résultats de recherche",
    placeholder: "Ex : Nom de mon enseigne (optionnel)",
  },
  businessAddresses: {
    label: "Les lieux où vous proposez une immersion",
    required: true,
    id: domElementIds.establishment[mode].businessAddresses,
    placeholder: "Ex : 26 rue du labrador, 37000 Tours",
  },
  "businessContact.lastName": {
    label: "Nom du référent",
    required: true,
    id: domElementIds.establishment[mode].businessContact.lastName,
  },
  "businessContact.firstName": {
    label: "Prénom du référent",
    required: true,
    id: domElementIds.establishment[mode].businessContact.firstName,
  },
  "businessContact.job": {
    label: "Fonction du référent",
    required: true,
    id: domElementIds.establishment[mode].businessContact.job,
  },
  "businessContact.phone": {
    label: "Numéro de téléphone (ne sera pas communiqué directement)",
    required: true,
    id: domElementIds.establishment[mode].businessContact.phone,
  },
  "businessContact.email": {
    label: "E-mail du référent",
    required: true,
    id: domElementIds.establishment[mode].businessContact.email,
  },
  "businessContact.copyEmails": {
    label: "Autres destinataires",
    hintText:
      "Adresses mail à mettre en copie, les utilisateurs liés à ces adresses auront accès aux discussions",
    placeholder: "Ex : cc1@mail.com, cc2@mail.com (optionnel)",
    id: domElementIds.establishment[mode].businessContact.copyEmails,
  },
  "businessContact.contactMethod": {
    label: "Comment souhaitez-vous que les candidats vous contactent ?",
    required: true,
    id: domElementIds.establishment[mode].businessContact.contactMethod,
  },
  isEngagedEnterprise: {
    label:
      "Mon entreprise est membre de la communauté « Les entreprises s'engagent »",
    id: domElementIds.establishment[mode].isEngagedEnterprise,
  },
  fitForDisabledWorkers: {
    label:
      "Mon entreprise est prête à accueillir des personnes en situation de handicap",
    id: domElementIds.establishment[mode].fitForDisabledWorkers,
  },
  appellations: {
    label: "Les métiers que vous proposez à l'immersion",
    id: domElementIds.establishment[mode].appellations,
    required: true,
  },
  website: {
    label: "URL vers votre site internet",
    id: domElementIds.establishment[mode].website,
    placeholder: "Ex : https://mon-site-internet.fr (optionnel)",
  },
  additionalInformation: {
    label: "Informations complémentaires",
    id: domElementIds.establishment[mode].additionalInformation,
    hintText:
      "En information complémentaire, nous vous conseillons de valoriser votre histoire afin de donner envie à un candidat de découvrir un métier au sein de votre établissement.",
    placeholder:
      "Ex : ma biographie d’entreprise (valeurs, écosystème, projections), mon potentiel d’embauche ou toute autre information essentielle pour l’accueil du bénéficiaire au sein de mon établissement (optionnel)",
  },
  maxContactsPerMonth: {
    label:
      "Au maximum, combien de mises en relation souhaitez-vous recevoir par mois ?",
    hintText:
      "Par exemple, en renseignant 5 : si vous avez déjà reçu 5 demandes ce mois, vous n'apparaîtrez plus dans la liste des entreprises accueillantes jusqu'au mois prochain.",
    id: domElementIds.establishment[mode].maxContactsPerMonth,
  },
  maxContactsPerMonthWhenAvailable: {
    label:
      "Quand vous serez à nouveau disponible, combien de mises en relation par mois souhaiteriez-vous recevoir ?",
    hintText:
      "Par exemple, en renseignant 5 : si vous avez déjà reçu 5 demandes ce mois, vous n'apparaîtrez plus dans la liste des entreprises accueillantes jusqu'au mois suivant.",
    id: domElementIds.establishment[mode].maxContactsPerMonthWhenAvailable,
  },
  nextAvailabilityDate: {
    label: "Quand serez-vous à nouveau disponible ?",
    id: domElementIds.establishment[mode].nextAvailabilityDateInput,
  },
  searchableBy: {
    label: "Qui souhaitez-vous accueillir en immersion ?",
    id: domElementIds.establishment[mode].searchableBy,
  },
  acquisitionKeyword: {
    label: "",
    id: "",
  },
  acquisitionCampaign: {
    label: "",
    id: "",
  },
});

export const mailtoHref = (siret: SiretDto) => {
  const lineBreak = "%0D%0A";
  const deleteEstablishmentSubject = "Demande de suppression d'entreprise";
  const deleteEstablishmentBody = (siret: SiretDto) =>
    `Bonjour,${lineBreak}Je souhaite supprimer les données de mon entreprise dont le numéro de SIRET est ${siret}.${lineBreak}Cordialement.`;

  return `mailto:${immersionFacileContactEmail}?subject=${deleteEstablishmentSubject}&body=${deleteEstablishmentBody(
    siret,
  )}`;
};
