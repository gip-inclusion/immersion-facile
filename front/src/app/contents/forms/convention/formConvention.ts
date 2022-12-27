import { InternshipKind } from "shared";
import { ConventionField } from "../../admin/types";
import { FormFieldAttributesForContent } from "../types";

export type FormFieldsObjectForContent<T> = Record<
  keyof T,
  FormFieldAttributesForContent
>;

export type FormConventionFieldsLabels = FormFieldsObjectForContent<
  Record<
    | ConventionField
    | "isCurrentEmployer"
    | "isEstablishmentTutorIsEstablishmentRepresentative"
    | "isMinor",
    FormFieldAttributesForContent
  >
>;

export const formConventionFieldsLabels: (
  conventionType: InternshipKind,
) => FormConventionFieldsLabels = (conventionType) => ({
  ...conventionSection(conventionType),
  ...beneficiarySection,
  ...establishmentTutorSection,
  ...beneficiaryRepresentativeSection,
  ...beneficiaryCurrentEmployerSection,
  ...establishmentRepresentativeSection,
  //
  // TODO: exclude these fields from typing
  //
  ...fieldsToExclude,
});

const conventionSection = (internshipKind: InternshipKind) => ({
  postalCode: {
    label: "Votre code postal",
    id: "form-convention-postalCode",
    required: true,
  },
  agencyId: {
    label: "Votre structure d'accompagnement",
    id: "form-convention-agencyId",
    required: true,
  },
  dateStart: {
    label:
      internshipKind === "mini-stage-cci"
        ? "Date de début du stage"
        : "Date de début de l'immersion",
    id: "form-convention-dateStart",
    required: true,
  },
  dateEnd: {
    label: "Date de fin de l'immersion",
    id: "form-convention-dateStart",
    required: true,
  },

  siret: {
    label: "Indiquez le SIRET de la structure d'accueil",
    description:
      "la structure d'accueil, c'est l'entreprise, le commerce, l'association ... où vous allez faire votre immersion",
    placeholder: "362 521 879 00034",
    id: "form-convention-siret",
    required: true,
  },
  businessName: {
    label: "Indiquez le nom (raison sociale) de l'établissement d'accueil",
    id: "form-convention-businessName",
    required: true,
  },

  workConditions: {
    label:
      "Conditions de travail, propres  au métier observé pendant l’immersion. ",
    description:
      "Ex : transport de marchandises longue distance - pas de retour au domicile pendant 2 jours",
    id: "form-convention-workConditions",
  },
  individualProtection: {
    label:
      "Un équipement de protection individuelle est-il fourni pour l’immersion ?",
    id: "form-convention-individualProtection",
    required: true,
  },
  sanitaryPrevention: {
    label:
      "Des mesures de prévention sanitaire sont-elles prévues pour l’immersion ?",
    id: "form-convention-sanitaryPrevention",
    required: true,
  },
  sanitaryPreventionDescription: {
    label: "Si oui, précisez-les",
    description: "Ex : fourniture de gel, de masques",
    id: "form-convention-sanitaryPreventionDescription",
  },
  immersionAddress: {
    label: "Adresse du lieu où se fera l'immersion",
    placeholder: "Ex: Bordeaux 33000",
    id: "form-convention-workConditions",
    required: true,
  },
  immersionObjective: {
    label: "Objet de la période de mise en situation en milieu professionnel",
    id: "form-convention-immersionObjective",
  },
  immersionAppellation: {
    label: "Intitulé du poste / métier observé pendant l'immersion",
    description: "Ex : employé libre service, web développeur, boulanger …",
    placeholder: "Prêt à porter",
    id: "form-convention-immersionAppellation",
    required: true,
  },
  immersionActivities: {
    label: "Activités observées / pratiquées pendant l'immersion",
    description: "Ex : mise en rayon, accueil et aide à la clientèle",
    id: "form-convention-immersionActivities",
    required: true,
  },
  immersionSkills: {
    label: "Compétences/aptitudes observées / évaluées pendant l'immersion",
    description:
      "Ex : communiquer à l'oral, résoudre des problèmes, travailler en équipe",
    id: "form-convention-immersionSkills",
  },
  isCurrentEmployer: {
    label:
      "Le bénéficiaire de l’immersion est-il actuellement salarié(e) d’une autre entreprise (que celle où l’immersion va avoir lieu) ?",
    id: "form-convention-isCurrentEmployer",
    required: true,
  },
  isEstablishmentTutorIsEstablishmentRepresentative: {
    label:
      "Est-ce que le tuteur de l'entreprise est le représentant de l'entreprise, signataire de la convention ?",
    id: "form-convention-isEstablishmentTutorIsEstablishmentRepresentative",
    required: true,
  },
  isMinor: {
    label: "La personne qui va faire l'immersion est-elle mineure ?",
    id: "form-convention-isMinor",
    required: true,
  },
});

const beneficiarySection = {
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
    label: "Email",
    id: "form-convention-signatories-beneficiary-email",
    required: true,
    placeholder: "nom@exemple.com",
    description:
      "cela nous permet de vous transmettre la validation de la convention",
  },

  "signatories.beneficiary.phone": {
    label: "Téléphone",
    description: "pour qu’on puisse vous contacter à propos de l’immersion",
    placeholder: "0605040302",
    id: "form-convention-signatories-beneficiary-phone",
    required: true,
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
  },
  "signatories.beneficiary.emergencyContactEmail": {
    label: "Email de la personne à prévenir en cas d'urgence",
    id: "form-convention-signatories-beneficiary-emergencyContactEmail",
  },
};
const establishmentTutorSection = {
  "establishmentTutor.email": {
    label: "Indiquez l'e-mail du tuteur",
    description: "pour envoyer la validation de la convention",
    placeholder: "nom@exemple.com",
    id: "form-convention-establishmentTutor-email",
    required: true,
  },
  "establishmentTutor.phone": {
    label:
      "Indiquez le numéro de téléphone du tuteur ou de la structure d'accueil",
    description: "pour qu’on puisse le/la contacter à propos de l’immersion",
    placeholder: "0605040302",
    id: "form-convention-establishmentTutor-phone",
    required: true,
  },
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
  "establishmentTutor.job": {
    label: "Indiquez la fonction du tuteur",
    description: "Ex : Pilote automobile",
    id: "form-convention-establishmentTutor-job",
    required: true,
  },
};

const beneficiaryRepresentativeSection = {
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
    description: "pour qu’on puisse vous contacter à propos de l’immersion",
    required: true,
  },
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
};

const beneficiaryCurrentEmployerSection = {
  "signatories.beneficiaryCurrentEmployer.businessName": {
    label: "Raison sociale de l'entreprise",
    id: "",
  },
  "signatories.beneficiaryCurrentEmployer.job": {
    label: "Fonction",
    id: "form-convention-signatories-beneficiaryCurrentEmployer-job",
  },
  "signatories.beneficiaryCurrentEmployer.email": {
    label: "Email",
    id: "form-convention-signatories-beneficiaryCurrentEmployer-phone",
  },
  "signatories.beneficiaryCurrentEmployer.phone": {
    label: "Téléphone",
    id: "form-convention-signatories-beneficiaryCurrentEmployer-phone",
  },
  "signatories.beneficiaryCurrentEmployer.firstName": {
    label: "Prénom",
    id: "form-convention-signatories-beneficiaryCurrentEmployer-firstName",
  },
  "signatories.beneficiaryCurrentEmployer.lastName": {
    label: "Nom de famille",
    id: "form-convention-signatories-beneficiaryCurrentEmployer-phone",
  },
  "signatories.beneficiaryCurrentEmployer.businessSiret": {
    label: "Siret",
    id: "form-convention-signatories-beneficiaryCurrentEmployer-businessSiret",
  },
};

const establishmentRepresentativeSection = {
  "signatories.establishmentRepresentative.email": {
    label: "Indiquez l'e-mail du représentant de l'entreprise",
    description: "pour envoyer la validation de la convention",
    id: "form-convention-signatories-establishmentRepresentative-email",
    required: true,
  },
  "signatories.establishmentRepresentative.phone": {
    label: "Indiquez le numéro de téléphone du représentant de l'entreprise",
    description: "pour qu’on puisse le contacter à propos de l’immersion",
    id: "form-convention-signatories-establishmentRepresentative-phone",
    required: true,
  },
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
};

const fieldsToExclude = {
  agencyName: {
    label: "",
    description: undefined,
    placeholder: undefined,
    id: "",
    name: "",
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
    name: "",
    required: undefined,
    autoComplete: undefined,
  },
  "signatories.establishmentRepresentative.role": {
    label: "",
    description: undefined,
    placeholder: undefined,
    id: "",
    name: "",
    required: undefined,
    autoComplete: undefined,
  },

  "signatories.beneficiaryCurrentEmployer.signedAt": {
    label: "",
    description: undefined,
    placeholder: undefined,
    id: "",
    name: "",
    required: undefined,
    autoComplete: undefined,
  },
  "signatories.beneficiaryCurrentEmployer.role": {
    label: "",
    description: undefined,
    placeholder: undefined,
    id: "",
    name: "",
    required: undefined,
    autoComplete: undefined,
  },
  "signatories.beneficiaryRepresentative.signedAt": {
    label: "",
    description: undefined,
    placeholder: undefined,
    id: "",
    name: "",
    required: undefined,
    autoComplete: undefined,
  },
  "signatories.beneficiaryRepresentative.role": {
    label: "",
    description: undefined,
    placeholder: undefined,
    id: "",
    name: "",
    required: undefined,
    autoComplete: undefined,
  },
  dateValidation: {
    label: "",
    description: undefined,
    placeholder: undefined,
    id: "",
    name: "",
    required: undefined,
    autoComplete: undefined,
  },
  schedule: {
    label: "",
    id: "",
  },
};
