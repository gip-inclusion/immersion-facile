import { AgencyDto } from "shared";
import { FormField } from "../types";

type ValidationSteps = "oneStep" | "twoSteps";

const numberOfStepsOptions: { label: string; value: ValidationSteps }[] = [
  {
    label: "1: La Convention est examinée et validée par la même personne",
    value: "oneStep",
  },
  {
    label:
      "2: La Convention est examinée par une personne puis validée par quelqu’un d’autre",
    value: "twoSteps",
  },
];

export type FormAgencyFieldsLabels = Record<
  keyof AgencyDto | "stepsForValidation",
  FormField<ValidationSteps>
>;

export const formAgencyFieldsLabels: FormAgencyFieldsLabels = {
  id: {
    label: "Identifiant",
    name: "id",
    id: "agency-id",
  },
  name: {
    label: "Nom de l'organisme",
    placeholder: "Agence de Boulogne-Billancourt",
    required: true,
    name: "name",
    id: "agency-name",
    autoComplete: "organization",
  },
  address: {
    label: "Adresse de la structure",
    required: true,
    name: "address",
    id: "agency-address",
  },
  position: {
    label: "Coordonnées géographiques de l'organisme",
    name: "position",
    id: "agency-position",
  },
  logoUrl: {
    label: "Changer le logo",
    id: "agency-logoUrl",
    name: "logoUrl",
    description: "Cela permet de personnaliser les mails automatisés.",
  },
  validatorEmails: {
    required: true,
    name: "validator-emails",
    id: "agency-validator-emails",
    label: "Emails de validation définitive de la demande de convention",
    placeholder: "equipe.validation@mail.com, valideur.dupont@mail.com",
    description:
      "Les personnes ou emails génériques suivants valideront les conventions préalablement examinées.",
  },
  adminEmails: {
    label: "Emails des administrateurs de la structure",
    name: "adminEmails",
    id: "agency-adminEmails",
  },
  signature: {
    label: "Texte de signature",
    name: "signature",
    id: "agency-signature",
    required: true,
    description:
      "Quel texte de signature souhaitez-vous pour les mails automatisés ?",
    placeholder: "L’équipe de l’agence de Boulogne-Billancourt",
  },
  status: {
    label: "Statut de la structure",
    name: "status",
    id: "agency-status",
  },
  kind: {
    label: "Type de structure",
    id: "agency-kind",
    name: "kind",
    required: true,
  },
  counsellorEmails: {
    name: "counsellor-emails",
    id: "agency-counsellor-emails",
    label: "Emails pour examen préalable de la demande de convention",
    placeholder: "equipe1@mail.com, conseiller.dupont@mail.com",
    description:
      "Les personnes ou emails génériques suivants recevront en premier les demandes de convention à examiner.",
  },
  codeSafir: {
    label: "Code SAFIR",
    name: "codeSafir",
    id: "agency-codeSafir",
  },
  questionnaireUrl: {
    name: "questionnaireUrl",
    id: "agency-questionnaireUrl",
    label: "Lien vers le document de support du bilan de fin d’immersion ",
    placeholder: "https://docs.google.com/document/d/mon-document-pour-bilan",
  },
  agencySiret: {
    label: "SIRET de la structure",
    name: "agencySiret",
    id: "agency-agencySiret",
  },
  stepsForValidation: {
    name: "steps-for-validation",
    id: "steps-for-validation",
    label: "Combien d'étapes de validation des immersions y a-t-il ? *",
    options: numberOfStepsOptions,
  },
};
