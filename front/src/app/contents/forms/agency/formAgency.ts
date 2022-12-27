import { AgencyDto } from "shared";
import { FormFieldsObject } from "src/app/hooks/formContents.hooks";
import { FormFieldAttributes } from "../types";

export type FormAgencyFieldsLabels = FormFieldsObject<
  Record<Partial<keyof AgencyDto | "stepsForValidation">, FormFieldAttributes>
>;

const defaultProps = {
  name: "",
};

export const formAgencyFieldsLabels: FormAgencyFieldsLabels = {
  id: {
    ...defaultProps,
    label: "Identifiant",
    id: "agency-id",
  },
  name: {
    ...defaultProps,
    label: "Nom de l'organisme",
    placeholder: "Agence de Boulogne-Billancourt",
    required: true,
    id: "agency-name",
    autoComplete: "organization",
  },
  address: {
    ...defaultProps,
    label: "Adresse de la structure",
    required: true,
    id: "agency-address",
  },
  position: {
    ...defaultProps,
    label: "Coordonnées géographiques de l'organisme",
    id: "agency-position",
  },
  logoUrl: {
    ...defaultProps,
    label: "Changer le logo",
    id: "agency-logoUrl",
    description: "Cela permet de personnaliser les mails automatisés.",
  },
  validatorEmails: {
    ...defaultProps,
    required: true,
    id: "agency-validator-emails",
    label: "Emails de validation définitive de la demande de convention",
    placeholder: "equipe.validation@mail.com, valideur.dupont@mail.com",
    description:
      "Les personnes ou emails génériques suivants valideront les conventions préalablement examinées.",
  },
  adminEmails: {
    ...defaultProps,
    label: "Emails des administrateurs de la structure",
    id: "agency-adminEmails",
  },
  signature: {
    ...defaultProps,
    label: "Texte de signature",
    id: "agency-signature",
    required: true,
    description:
      "Quel texte de signature souhaitez-vous pour les mails automatisés ?",
    placeholder: "L’équipe de l’agence de Boulogne-Billancourt",
  },
  status: {
    ...defaultProps,
    label: "Statut de la structure",
    id: "agency-status",
  },
  kind: {
    ...defaultProps,
    label: "Type de structure",
    id: "agency-kind",
    required: true,
  },
  counsellorEmails: {
    ...defaultProps,
    id: "agency-counsellor-emails",
    label: "Emails pour examen préalable de la demande de convention",
    placeholder: "equipe1@mail.com, conseiller.dupont@mail.com",
    description:
      "Les personnes ou emails génériques suivants recevront en premier les demandes de convention à examiner.",
  },
  codeSafir: {
    ...defaultProps,
    label: "Code SAFIR",
    id: "agency-codeSafir",
  },
  questionnaireUrl: {
    ...defaultProps,
    id: "agency-questionnaireUrl",
    label: "Lien vers le document de support du bilan de fin d’immersion ",
    placeholder: "https://docs.google.com/document/d/mon-document-pour-bilan",
  },
  agencySiret: {
    ...defaultProps,
    label: "SIRET de la structure",
    id: "agency-agencySiret",
  },
  stepsForValidation: {
    ...defaultProps,
    id: "steps-for-validation",
    label: "Combien d'étapes de validation des immersions y a-t-il ? *",
  },
};
