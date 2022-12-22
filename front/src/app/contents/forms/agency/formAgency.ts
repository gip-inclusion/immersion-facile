import { AgencyDto } from "shared";

type ValidationSteps = "oneStep" | "twoSteps";

type FormField = {
  label: string;
  description?: string;
  placeholder?: string;
  options?: { label: string; value: ValidationSteps }[];
};

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

export const formAgencyFieldsLabels: Record<
  keyof AgencyDto | "stepsForValidation",
  FormField
> = {
  id: {
    label: "Identifiant",
  },
  name: {
    label: "Nom de l'organisme *",
    placeholder: "Agence de Boulogne-Billancourt",
  },
  address: {
    label: "Adresse de la structure *",
  },
  position: {
    label: "Coordonnées géographiques de l'organisme",
  },
  logoUrl: {
    label: "URL du logo de l'organisme",
  },
  validatorEmails: {
    label: "Emails de validation définitive de la demande de convention *",
    placeholder: "equipe.validation@mail.com, valideur.dupont@mail.com",
    description:
      "Les personnes ou emails génériques suivants valideront les conventions préalablement examinées.",
  },
  adminEmails: {
    label: "Emails des administrateurs de la structure",
  },
  signature: {
    label: "Texte de signature *",
    description:
      "Quel texte de signature souhaitez-vous pour les mails automatisés ?",
    placeholder: "L’équipe de l’agence de Boulogne-Billancourt",
  },
  status: {
    label: "Statut de la structure",
  },
  kind: {
    label: "Type de structure *",
  },
  counsellorEmails: {
    label: "Emails pour examen préalable de la demande de convention",
    placeholder: "equipe1@mail.com, conseiller.dupont@mail.com",
    description:
      "Les personnes ou emails génériques suivants recevront en premier les demandes de convention à examiner.",
  },
  codeSafir: {
    label: "Code SAFIR",
  },
  questionnaireUrl: {
    label: "Lien vers le document de support du bilan de fin d’immersion ",
    placeholder: "https://docs.google.com/document/d/mon-document-pour-bilan",
  },
  agencySiret: {
    label: "SIRET de la structure",
  },
  stepsForValidation: {
    label: "Combien d'étapes de validation des immersions y a-t-il ? *",
    options: numberOfStepsOptions,
  },
};

export const formAgencyErrorLabels: Partial<Record<keyof AgencyDto, string>> =
  Object.keys(formAgencyFieldsLabels).reduce(
    (sum, field) => ({
      ...sum,
      [field]: formAgencyFieldsLabels[field as keyof AgencyDto]?.label,
    }),
    {},
  );
