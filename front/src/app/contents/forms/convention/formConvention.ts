import { InternshipKind } from "shared";
import { ConventionField } from "../../admin/types";
import { FormFieldAttributesForContent } from "../types";

export type FormFieldsObjectForContent<T> = Record<
  keyof T,
  FormFieldAttributesForContent
>;

// Remove and replace by ConventionField when postalCode is removed from ConventionDTO
type ConventionFieldWithoutPostalCode = Exclude<ConventionField, "postalCode">;

type FormFieldKeys =
  | ConventionFieldWithoutPostalCode
  | "isCurrentEmployer"
  | "isEstablishmentTutorIsEstablishmentRepresentative"
  | "isMinor";

export type FormConventionFieldsLabels = FormFieldsObjectForContent<
  Record<FormFieldKeys, FormFieldAttributesForContent>
>;

export const formConventionFieldsLabels: (
  internshipKind: InternshipKind,
) => FormConventionFieldsLabels = (internshipKind) => ({
  ...conventionSection(internshipKind),
  ...beneficiarySection(internshipKind),
  ...beneficiaryRepresentativeSection(internshipKind),
  ...beneficiaryCurrentEmployerSection,
  ...establishmentTutorSection(internshipKind),
  ...establishmentRepresentativeSection(internshipKind),
  //
  // TODO: exclude these fields from typing
  //
  ...fieldsToExclude,
});

const conventionSection = (internshipKind: InternshipKind) => ({
  agencyDepartment: {
    label:
      internshipKind === "immersion"
        ? "Votre département"
        : "Saisissez le département de votre entreprise d’accueil",
    id: "form-convention-agencyDepartement",
    required: true,
    placeholder: "Veuillez sélectionner un département",
  },
  agencyId: {
    label:
      internshipKind === "immersion"
        ? "Votre structure d'accompagnement"
        : "Choisissez le Point Orientation de la chambre de commerce et d’industrie près de chez vous !",
    id: "form-convention-agencyId",
    required: true,
  },
  dateStart: {
    label:
      internshipKind === "immersion"
        ? "Date de début de l'immersion"
        : "Date de début du stage",
    id: "form-convention-dateStart",
    required: true,
  },
  dateEnd: {
    label:
      internshipKind === "immersion"
        ? "Date de fin de l'immersion"
        : "Date de fin du stage",
    id: "form-convention-dateStart",
    required: true,
  },
  siret: {
    label:
      internshipKind === "immersion"
        ? "Indiquez le SIRET de la structure d'accueil"
        : "Indiquez le SIRET de l’entreprise où vous allez faire votre stage",
    description:
      internshipKind === "immersion"
        ? "la structure d'accueil, c'est l'entreprise, le commerce, l'association ... où vous allez faire votre immersion"
        : "la structure d'accueil, où vous allez faire votre stage",
    placeholder: "362 521 879 00034",
    id: "form-convention-siret",
    required: true,
  },
  businessName: {
    label:
      internshipKind === "immersion"
        ? "Indiquez le nom (raison sociale) de l'établissement d'accueil"
        : "Indiquez le nom (raison sociale) de votre entreprise",
    id: "form-convention-businessName",
    required: true,
  },
  workConditions: {
    label:
      internshipKind === "immersion"
        ? "Conditions de travail, propres au métier observé pendant l’immersion. "
        : "Conditions de travail, propres au métier observé pendant le stage ",
    description:
      "Ex : transport de marchandises longue distance - pas de retour au domicile pendant 2 jours",
    id: "form-convention-workConditions",
  },
  individualProtection: {
    label:
      internshipKind === "immersion"
        ? "Un équipement de protection individuelle est-il fourni pour l’immersion ?"
        : "Un équipement de protection individuelle est-il fourni pour le stage",
    id: "form-convention-individualProtection",
    required: true,
  },
  sanitaryPrevention: {
    label:
      internshipKind === "immersion"
        ? "Des mesures de prévention sanitaire sont-elles prévues pour l’immersion ?"
        : "Des mesures de prévention sanitaire sont-elles prévues pour le stage ?",
    id: "form-convention-sanitaryPrevention",
    required: true,
  },
  sanitaryPreventionDescription: {
    label: "Si oui, précisez-les",
    description: "Ex : fourniture de gel, de masques",
    id: "form-convention-sanitaryPreventionDescription",
  },
  immersionAddress: {
    label:
      internshipKind === "immersion"
        ? "Adresse du lieu où se fera l'immersion"
        : "Adresse du lieu où se fera le stage",
    placeholder: "Ex: Bordeaux 33000",
    id: "form-convention-workConditions",
    required: true,
  },
  immersionObjective: {
    label: "Objet de la période de mise en situation en milieu professionnel",
    id: "form-convention-immersionObjective",
  },
  immersionAppellation: {
    label:
      internshipKind === "immersion"
        ? "Intitulé du poste / métier observé pendant l'immersion"
        : "Intitulé du métier observé pendant le stage",
    description: "Ex : employé libre service, web développeur, boulanger …",
    placeholder: "Prêt à porter",
    id: "form-convention-immersionAppellation",
    required: true,
  },
  immersionActivities: {
    label:
      internshipKind === "immersion"
        ? "Activités observées / pratiquées pendant l'immersion"
        : "Activités observées / pratiquées pendant le stage",
    description: "Ex : mise en rayon, accueil et aide à la clientèle",
    id: "form-convention-immersionActivities",
    required: true,
  },
  immersionSkills: {
    label:
      internshipKind === "immersion"
        ? "Compétences/aptitudes observées / évaluées pendant l'immersion"
        : "Compétences/aptitudes observées / évaluées pendant le stage",
    description:
      "Ex : communiquer à l'oral, résoudre des problèmes, travailler en équipe",
    id: "form-convention-immersionSkills",
  },
  isCurrentEmployer: {
    label:
      "Si le bénéficiaire est actuellement salarié d'une entreprise, l'immersion va-t-elle se dérouler pendant le temps de travail habituel ?",
    id: "form-convention-isCurrentEmployer",
    required: true,
  },
  isEstablishmentTutorIsEstablishmentRepresentative: {
    label:
      "Est-ce que le tuteur de l'entreprise est le représentant de l'entreprise, signataire de la convention ?",
    id: "form-convention-isEstablishmentTutorIsEstablishmentRepresentative",
    required: true,
  },
  businessAdvantages: {
    label: "Avantages",
    id: "form-convention-businessAdvantages",
    description: "Avantages proposés par l'entreprise",
    placeholder:
      "navettes jusqu'au lieu de travail, panier repas, hébergement...",
  },
  isMinor: {
    label: "La personne qui va faire l'immersion est-elle mineure ?",
    id: "form-convention-isMinor",
    required: true,
  },
});

const beneficiarySection = (internshipKind: InternshipKind) => ({
  "signatories.beneficiary.firstName": {
    label: "Prénom",
    id: "form-convention-signatories-beneficiary-firstName",
    required: true,
  },
  "signatories.beneficiary.lastName": {
    label: "Nom de famille",
    id: "form-convention-signatories-beneficiary-lastName",
    required: true,
  },
  "signatories.beneficiary.birthdate": {
    label: "Date de naissance",
    id: "form-convention-signatories-beneficiary-birthdate",
    required: true,
  },
  "signatories.beneficiary.email": {
    label: "E-mail",
    id: "form-convention-signatories-beneficiary-email",
    required: true,
    placeholder: "nom@exemple.com",
    description:
      "cela nous permet de vous transmettre la validation de la convention",
  },
  "signatories.beneficiary.phone": {
    label: "Téléphone",
    description:
      internshipKind === "immersion"
        ? "pour qu’on puisse vous contacter à propos de l’immersion"
        : "pour qu’on puisse vous contacter à propos du stage",
    placeholder: "0605040302",
    id: "form-convention-signatories-beneficiary-phone",
    required: true,
  },
  "signatories.beneficiary.levelOfEducation": {
    label: "Niveau d'étude",
    id: "form-convention-signatories-beneficiary-level-of-education",
    placeholder: "Précisez votre statut",
    required: true,
  },
  "signatories.beneficiary.financiaryHelp": {
    label: "Aide financière",
    id: "form-convention-signatories-beneficiary-financiary-help",
    placeholder: "exemple: aide à la mobilité",
    description:
      "Le bénéficiaire a-t-il besoin d'une aide financière pour réaliser l'immersion?",
  },
  "signatories.beneficiary.federatedIdentity": {
    // hidden field
    label: "",
    id: "form-convention-signatories-beneficiary-federatedIdentity",
  },
  "signatories.beneficiary.emergencyContact": {
    label: "Prénom et nom de la personne à prévenir en cas d'urgence",
    id: "form-convention-signatories-beneficiary-emergencyContact",
  },
  "signatories.beneficiary.emergencyContactPhone": {
    label: "Téléphone de la personne à prévenir en cas d'urgence",
    id: "form-convention-signatories-beneficiary-emergencyContactPhone",
    placeholder: "0606060607",
  },
  "signatories.beneficiary.emergencyContactEmail": {
    label: "E-mail de la personne à prévenir en cas d'urgence",
    id: "form-convention-signatories-beneficiary-emergencyContactEmail",
    placeholder: "contact@urgence.com",
  },
});

const establishmentTutorSection = (internshipKind: InternshipKind) => ({
  "establishmentTutor.firstName": {
    label: "Indiquez le prénom du tuteur",
    description: "Ex : Alain",
    id: "form-convention-establishmentTutor-firstName",
    required: true,
  },
  "establishmentTutor.lastName": {
    label: "Indiquez le nom du tuteur",
    description: "Ex : Prost",
    id: "form-convention-establishmentTutor-lastName",
    required: true,
  },
  "establishmentTutor.email": {
    label: "Indiquez l'e-mail du tuteur",
    description: "pour envoyer la validation de la convention",
    placeholder: "nom@exemple.com",
    id: "form-convention-establishmentTutor-email",
    required: true,
  },
  "establishmentTutor.phone": {
    label:
      internshipKind === "immersion"
        ? "Indiquez le numéro de téléphone du tuteur ou de la structure d'accueil"
        : "Indiquez le numéro de téléphone du tuteur ou de l’entreprise",
    description:
      internshipKind === "immersion"
        ? "pour qu’on puisse le/la contacter à propos de l’immersion"
        : "pour qu’on puisse le/la contacter à propos du stage",
    placeholder: "0605040302",
    id: "form-convention-establishmentTutor-phone",
    required: true,
  },
  "establishmentTutor.job": {
    label: "Indiquez la fonction du tuteur",
    description: "Ex : Pilote automobile",
    id: "form-convention-establishmentTutor-job",
    required: true,
  },
});

const beneficiaryRepresentativeSection = (internshipKind: InternshipKind) => ({
  "signatories.beneficiaryRepresentative.firstName": {
    label: "Prénom du représentant légal",
    id: "form-convention-signatories-beneficiaryRepresentative-firstName",
    required: true,
  },
  "signatories.beneficiaryRepresentative.lastName": {
    label: "Nom de famille du représentant légal",
    id: "form-convention-signatories-beneficiaryRepresentative-lastName",
    required: true,
  },
  "signatories.beneficiaryRepresentative.email": {
    label: "Adresse email du représentant légal",
    id: "form-convention-signatories-beneficiaryRepresentative-email",
    description:
      "cela nous permet de vous transmettre la validation de la convention",
    required: true,
  },
  "signatories.beneficiaryRepresentative.phone": {
    label: "Téléphone",
    id: "form-convention-signatories-beneficiaryRepresentative-phone",
    description:
      internshipKind === "immersion"
        ? "pour qu’on puisse vous contacter à propos de l’immersion"
        : "pour qu’on puisse vous contacter à propos du stage",
    required: true,
  },
});

const beneficiaryCurrentEmployerSection = {
  "signatories.beneficiaryCurrentEmployer.businessName": {
    label: "Raison sociale de l'entreprise",
    id: "form-convention-signatories-beneficiaryCurrentEmployer-businessName",
    required: true,
  },
  "signatories.beneficiaryCurrentEmployer.job": {
    label: "Fonction",
    id: "form-convention-signatories-beneficiaryCurrentEmployer-job",
  },
  "signatories.beneficiaryCurrentEmployer.email": {
    label: "E-mail",
    id: "form-convention-signatories-beneficiaryCurrentEmployer-phone",
    required: true,
  },
  "signatories.beneficiaryCurrentEmployer.phone": {
    label: "Téléphone",
    id: "form-convention-signatories-beneficiaryCurrentEmployer-phone",
    required: true,
  },
  "signatories.beneficiaryCurrentEmployer.firstName": {
    label: "Prénom",
    id: "form-convention-signatories-beneficiaryCurrentEmployer-firstName",
    required: true,
  },
  "signatories.beneficiaryCurrentEmployer.lastName": {
    label: "Nom de famille",
    id: "form-convention-signatories-beneficiaryCurrentEmployer-phone",
    required: true,
  },
  "signatories.beneficiaryCurrentEmployer.businessSiret": {
    label: "Siret",
    id: "form-convention-signatories-beneficiaryCurrentEmployer-businessSiret",
    required: true,
  },
};

const establishmentRepresentativeSection = (
  internshipKind: InternshipKind,
) => ({
  "signatories.establishmentRepresentative.firstName": {
    label: "Indiquez le prénom du représentant de l'entreprise",
    description: "Ex : Alain",
    id: "form-convention-signatories-establishmentRepresentative-firstName",
    required: true,
  },
  "signatories.establishmentRepresentative.lastName": {
    label: "Indiquez le nom du représentant de l'entreprise",
    description: "Ex : Prost",
    id: "form-convention-signatories-establishmentRepresentative-lastName",
    required: true,
  },
  "signatories.establishmentRepresentative.email": {
    label: "Indiquez l'e-mail du représentant de l'entreprise",
    placeholder: "nom@exemple.com",
    description: "pour envoyer la validation de la convention",
    id: "form-convention-signatories-establishmentRepresentative-email",
    required: true,
  },
  "signatories.establishmentRepresentative.phone": {
    label: "Indiquez le numéro de téléphone du représentant de l'entreprise",
    placeholder: "0605040302",
    description:
      internshipKind === "immersion"
        ? "pour qu’on puisse le/la contacter à propos de l’immersion"
        : "pour qu’on puisse le/la contacter à propos du stage",
    id: "form-convention-signatories-establishmentRepresentative-phone",
    required: true,
  },
});

const fieldsToExclude = {
  agencyName: {
    label: "",
    description: undefined,
    placeholder: undefined,
    id: "",
    required: undefined,
    autoComplete: undefined,
  },
  "establishmentTutor.role": {
    // to exclude
    label: "",
    id: "",
  },
  "signatories.beneficiary.signedAt": {
    // to exclude
    label: "",
    id: "",
  },
  "signatories.beneficiary.role": {
    // to exclude
    label: "",
    id: "",
  },
  signatories: {
    label: "",
    id: "",
  },

  establishmentTutor: {
    label: "",
    id: "",
  },
  externalId: {
    label: "",
    id: "",
  },
  internshipKind: {
    label: "",
    id: "",
  },
  id: {
    label: "",
    id: "",
  },
  status: {
    label: "",
    id: "",
  },
  rejectionJustification: {
    label: "",
    id: "",
  },
  dateSubmission: {
    label: "",
    id: "",
  },
  "signatories.establishmentRepresentative.signedAt": {
    label: "",
    description: undefined,
    placeholder: undefined,
    id: "",
    required: undefined,
    autoComplete: undefined,
  },
  "signatories.establishmentRepresentative.role": {
    label: "",
    description: undefined,
    placeholder: undefined,
    id: "",
    required: undefined,
    autoComplete: undefined,
  },

  "signatories.beneficiaryCurrentEmployer.signedAt": {
    label: "",
    description: undefined,
    placeholder: undefined,
    id: "",
    required: undefined,
    autoComplete: undefined,
  },
  "signatories.beneficiaryCurrentEmployer.role": {
    label: "",
    description: undefined,
    placeholder: undefined,
    id: "",
    required: undefined,
    autoComplete: undefined,
  },
  "signatories.beneficiaryRepresentative.signedAt": {
    label: "",
    description: undefined,
    placeholder: undefined,
    id: "",
    required: undefined,
    autoComplete: undefined,
  },
  "signatories.beneficiaryRepresentative.role": {
    label: "",
    description: undefined,
    placeholder: undefined,
    id: "",
    required: undefined,
    autoComplete: undefined,
  },
  dateValidation: {
    label: "",
    description: undefined,
    placeholder: undefined,
    id: "",
    required: undefined,
    autoComplete: undefined,
  },
  schedule: {
    label: "",
    id: "",
  },
};
