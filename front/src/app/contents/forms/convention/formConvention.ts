import { domElementIds, InternshipKind } from "shared";
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

const {
  conventionSection: conventionSectionIds,
  beneficiarySection: beneficiarySectionIds,
  establishmentTutorSection: establishmentTutorSectionIds,
  beneficiaryRepresentativeSection: beneficiaryRepresentativeSectionIds,
  beneficiaryCurrentEmployerSection: beneficiaryCurrentEmployerSectionIds,
  establishmentRepresentativeSection: establishmentRepresentativeSectionIds,
} = domElementIds.conventionImmersionRoute;

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
    id: conventionSectionIds.agencyDepartment,
    required: true,
    placeholder: "Veuillez sélectionner un département",
  },
  agencyId: {
    label:
      internshipKind === "immersion"
        ? "Votre structure d'accompagnement"
        : "Choisissez le Point Orientation de la chambre de commerce et d’industrie près de chez vous !",
    id: conventionSectionIds.agencyId,
    required: true,
    placeholder:
      internshipKind === "immersion"
        ? "Veuillez sélectionner une structure d'accompagnement"
        : "Veuillez sélectionner un point orientation",
  },
  dateStart: {
    label:
      internshipKind === "immersion"
        ? "Date de début de l'immersion"
        : "Date de début du stage",
    id: conventionSectionIds.dateStart,
    required: true,
  },
  dateEnd: {
    label:
      internshipKind === "immersion"
        ? "Date de fin de l'immersion"
        : "Date de fin du stage",
    id: conventionSectionIds.dateEnd,
    required: true,
  },
  siret: {
    label:
      internshipKind === "immersion"
        ? "Indiquez le SIRET de la structure d'accueil"
        : "Indiquez le SIRET de l’entreprise où vous allez faire votre stage",
    hintText:
      internshipKind === "immersion"
        ? "la structure d'accueil, c'est l'entreprise, le commerce, l'association ... où vous allez faire votre immersion"
        : "la structure d'accueil, où vous allez faire votre stage",
    placeholder: "362 521 879 00034",
    id: conventionSectionIds.siret,
    required: true,
  },
  businessName: {
    label:
      internshipKind === "immersion"
        ? "Indiquez le nom (raison sociale) de l'établissement d'accueil"
        : "Indiquez le nom (raison sociale) de votre entreprise",
    id: conventionSectionIds.businessName,
    required: true,
  },
  workConditions: {
    label:
      internshipKind === "immersion"
        ? "Conditions de travail, propres au métier observé pendant l’immersion. "
        : "Conditions de travail, propres au métier observé pendant le stage ",
    hintText: "Précisez les conditions de travail, propres au métier observé ",
    id: conventionSectionIds.workConditions,
    placeholder:
      "Ex : transport de marchandises longue distance - pas de retour au domicile pendant 2 jours (optionnel)",
  },
  individualProtection: {
    label:
      internshipKind === "immersion"
        ? "Un équipement de protection individuelle est-il fourni pour l’immersion ?"
        : "Un équipement de protection individuelle est-il fourni pour le stage",
    id: conventionSectionIds.individualProtection,
    required: true,
  },
  sanitaryPrevention: {
    label:
      internshipKind === "immersion"
        ? "Des mesures de prévention sanitaire sont-elles prévues pour l’immersion ?"
        : "Des mesures de prévention sanitaire sont-elles prévues pour le stage ?",
    id: conventionSectionIds.sanitaryPrevention,
    required: true,
  },
  sanitaryPreventionDescription: {
    label: "Si oui, précisez-les",
    hintText:
      "Précisez les mesures de prévention sanitaire prévues pour l’immersion",
    id: conventionSectionIds.sanitaryPreventionDescription,
    placeholder: "Ex : fourniture de gel, de masques (optionnel)",
  },
  immersionAddress: {
    label:
      internshipKind === "immersion"
        ? "Adresse du lieu où se fera l'immersion"
        : "Adresse du lieu où se fera le stage",
    placeholder: "Ex: 26 rue du labrador, 37000 Tours",
    id: conventionSectionIds.immersionAddress,
    required: true,
  },
  immersionObjective: {
    label: "Objet de la période de mise en situation en milieu professionnel",
    id: conventionSectionIds.immersionObjective,
    required: true,
  },
  immersionAppellation: {
    label:
      internshipKind === "immersion"
        ? "Intitulé du poste / métier observé pendant l'immersion"
        : "Intitulé du métier observé pendant le stage",
    hintText: "Ex : employé libre service, web développeur, boulanger …",
    placeholder: "Prêt à porter",
    id: conventionSectionIds.immersionAppellation,
    required: true,
  },
  immersionActivities: {
    label:
      internshipKind === "immersion"
        ? "Activités observées / pratiquées pendant l'immersion"
        : "Activités observées / pratiquées pendant le stage",
    hintText: "Précisez les activités observées / pratiquées",
    id: conventionSectionIds.immersionActivities,
    required: true,
    placeholder: "Ex : mise en rayon, accueil et aide à la clientèle",
  },
  immersionSkills: {
    label:
      internshipKind === "immersion"
        ? "Compétences/aptitudes observées / évaluées pendant l'immersion"
        : "Compétences/aptitudes observées / évaluées pendant le stage",
    hintText: "Précisez les compétences/aptitudes observées",
    id: conventionSectionIds.immersionSkills,
    placeholder:
      "Ex : communiquer à l'oral, résoudre des problèmes, travailler en équipe (optionnel)",
  },
  isCurrentEmployer: {
    label:
      "Si le bénéficiaire est actuellement salarié d'une entreprise, l'immersion va-t-elle se dérouler pendant le temps de travail habituel ?",
    id: conventionSectionIds.isCurrentEmployer,
    required: true,
  },
  isEstablishmentTutorIsEstablishmentRepresentative: {
    label:
      internshipKind === "immersion"
        ? "Est-ce que le tuteur de l'immersion est le représentant de l'entreprise, signataire de la convention ?"
        : "Est-ce que le tuteur de stage est le représentant de l'entreprise, signataire de la convention ?",

    id: conventionSectionIds.isEstablishmentTutorIsEstablishmentRepresentative,
    required: true,
  },
  businessAdvantages: {
    label: "Avantages proposés par l'entreprise",
    id: conventionSectionIds.businessAdvantages,
    hintText: "Précisez les avantages proposés par l'entreprise",
    placeholder:
      "Ex : navettes jusqu'au lieu de travail, panier repas, hébergement... (optionnel)",
  },
  isMinor: {
    label: "Êtes-vous mineur ou majeur protégé ?",
    id: conventionSectionIds.isMinor,
    required: true,
  },
});

const beneficiarySection = (internshipKind: InternshipKind) => ({
  "signatories.beneficiary.firstName": {
    label: "Prénom",
    id: beneficiarySectionIds.firstName,
    required: true,
  },
  "signatories.beneficiary.lastName": {
    label: "Nom de famille",
    id: beneficiarySectionIds.lastName,
    required: true,
  },
  "signatories.beneficiary.birthdate": {
    label: "Date de naissance",
    id: beneficiarySectionIds.birthdate,
    required: true,
  },
  "signatories.beneficiary.email": {
    label: "E-mail",
    id: beneficiarySectionIds.email,
    required: true,
    placeholder: "nom@exemple.com",
    hintText:
      "cela nous permet de vous transmettre la validation de la convention",
  },
  "signatories.beneficiary.phone": {
    label: "Téléphone",
    hintText:
      internshipKind === "immersion"
        ? "pour qu’on puisse vous contacter à propos de l’immersion"
        : "pour qu’on puisse vous contacter à propos du stage",
    placeholder: "0605040302",
    id: beneficiarySectionIds.phone,
    required: true,
  },
  "signatories.beneficiary.levelOfEducation": {
    label: "Niveau d'étude",
    id: beneficiarySectionIds.levelOfEducation,
    placeholder: "Précisez votre statut",
    required: true,
  },
  "signatories.beneficiary.financiaryHelp": {
    label: "Aide matérielle",
    id: beneficiarySectionIds.financiaryHelp,
    placeholder: "Ex : aide à la mobilité (optionnel)",
    hintText:
      "Le bénéficiaire a-t-il besoin d'une aide matérielle pour réaliser l'immersion?",
  },
  "signatories.beneficiary.federatedIdentity": {
    // hidden field
    label: "",
    id: beneficiarySectionIds.federatedIdentity,
  },
  "signatories.beneficiary.emergencyContact": {
    label: "Prénom et nom de la personne à prévenir en cas d'urgence",
    id: beneficiarySectionIds.emergencyContact,
    placeholder: "Ex : Jean Dupont (optionnel)",
  },
  "signatories.beneficiary.emergencyContactPhone": {
    label: "Téléphone de la personne à prévenir en cas d'urgence",
    id: beneficiarySectionIds.emergencyContactPhone,
    placeholder: "Ex : 0606060607 (optionnel)",
  },
  "signatories.beneficiary.emergencyContactEmail": {
    label: "E-mail de la personne à prévenir en cas d'urgence",
    id: beneficiarySectionIds.emergencyContactEmail,
    placeholder: "Ex : contact@urgence.com (optionnel)",
  },
});

const establishmentTutorSection = (internshipKind: InternshipKind) => ({
  "establishmentTutor.firstName": {
    label: "Indiquez le prénom du tuteur",
    hintText: "Ex : Alain",
    id: establishmentTutorSectionIds.firstName,
    required: true,
  },
  "establishmentTutor.lastName": {
    label: "Indiquez le nom du tuteur",
    hintText: "Ex : Prost",
    id: establishmentTutorSectionIds.lastName,
    required: true,
  },
  "establishmentTutor.email": {
    label: "Indiquez l'e-mail du tuteur",
    hintText: "pour envoyer la validation de la convention",
    placeholder: "nom@exemple.com",
    id: establishmentTutorSectionIds.email,
    required: true,
  },
  "establishmentTutor.phone": {
    label:
      internshipKind === "immersion"
        ? "Indiquez le numéro de téléphone du tuteur ou de la structure d'accueil"
        : "Indiquez le numéro de téléphone du tuteur ou de l’entreprise",
    hintText:
      internshipKind === "immersion"
        ? "pour qu’on puisse le/la contacter à propos de l’immersion"
        : "pour qu’on puisse le/la contacter à propos du stage",
    placeholder: "0605040302",
    id: establishmentTutorSectionIds.phone,
    required: true,
  },
  "establishmentTutor.job": {
    label: "Indiquez la fonction du tuteur",
    hintText: "Ex : Pilote automobile",
    id: establishmentTutorSectionIds.job,
    required: true,
  },
});

const beneficiaryRepresentativeSection = (internshipKind: InternshipKind) => ({
  "signatories.beneficiaryRepresentative.firstName": {
    label: "Prénom du représentant légal",
    id: beneficiaryRepresentativeSectionIds.firstName,
    required: true,
  },
  "signatories.beneficiaryRepresentative.lastName": {
    label: "Nom de famille du représentant légal",
    id: beneficiaryRepresentativeSectionIds.lastName,
    required: true,
  },
  "signatories.beneficiaryRepresentative.email": {
    label: "Adresse email du représentant légal",
    id: beneficiaryRepresentativeSectionIds.email,
    hintText:
      "cela nous permet de vous transmettre la validation de la convention",
    required: true,
  },
  "signatories.beneficiaryRepresentative.phone": {
    label: "Téléphone",
    id: beneficiaryRepresentativeSectionIds.phone,
    hintText:
      internshipKind === "immersion"
        ? "pour qu’on puisse vous contacter à propos de l’immersion"
        : "pour qu’on puisse vous contacter à propos du stage",
    required: true,
  },
});

const beneficiaryCurrentEmployerSection = {
  "signatories.beneficiaryCurrentEmployer.businessName": {
    label: "Raison sociale de l'entreprise",
    id: beneficiaryCurrentEmployerSectionIds.businessName,
    required: true,
  },
  "signatories.beneficiaryCurrentEmployer.job": {
    label: "Fonction",
    id: beneficiaryCurrentEmployerSectionIds.job,
  },
  "signatories.beneficiaryCurrentEmployer.email": {
    label: "E-mail",
    id: beneficiaryCurrentEmployerSectionIds.email,
    required: true,
  },
  "signatories.beneficiaryCurrentEmployer.phone": {
    label: "Téléphone",
    id: beneficiaryCurrentEmployerSectionIds.phone,
    required: true,
  },
  "signatories.beneficiaryCurrentEmployer.firstName": {
    label: "Prénom",
    id: beneficiaryCurrentEmployerSectionIds.firstName,
    required: true,
  },
  "signatories.beneficiaryCurrentEmployer.lastName": {
    label: "Nom de famille",
    id: beneficiaryCurrentEmployerSectionIds.lastName,
    required: true,
  },
  "signatories.beneficiaryCurrentEmployer.businessSiret": {
    label: "Siret",
    id: beneficiaryCurrentEmployerSectionIds.businessSiret,
    required: true,
  },
};

const establishmentRepresentativeSection = (
  internshipKind: InternshipKind,
) => ({
  "signatories.establishmentRepresentative.firstName": {
    label: "Indiquez le prénom du représentant de l'entreprise",
    hintText: "Ex : Alain",
    id: establishmentRepresentativeSectionIds.firstName,
    required: true,
  },
  "signatories.establishmentRepresentative.lastName": {
    label: "Indiquez le nom du représentant de l'entreprise",
    hintText: "Ex : Prost",
    id: establishmentRepresentativeSectionIds.lastName,
    required: true,
  },
  "signatories.establishmentRepresentative.email": {
    label: "Indiquez l'e-mail du représentant de l'entreprise",
    placeholder: "nom@exemple.com",
    hintText: "pour envoyer la validation de la convention",
    id: establishmentRepresentativeSectionIds.email,
    required: true,
  },
  "signatories.establishmentRepresentative.phone": {
    label: "Indiquez le numéro de téléphone du représentant de l'entreprise",
    placeholder: "0605040302",
    hintText:
      internshipKind === "immersion"
        ? "pour qu’on puisse le/la contacter à propos de l’immersion"
        : "pour qu’on puisse le/la contacter à propos du stage",
    id: establishmentRepresentativeSectionIds.phone,
    required: true,
  },
});

const fieldsToExclude = {
  agencyName: {
    label: "",
    hintText: undefined,
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
  statusJustification: {
    label: "",
    id: "",
  },
  dateSubmission: {
    label: "",
    id: "",
  },
  "signatories.establishmentRepresentative.signedAt": {
    label: "",
    hintText: undefined,
    placeholder: undefined,
    id: "",
    required: undefined,
    autoComplete: undefined,
  },
  "signatories.establishmentRepresentative.role": {
    label: "",
    hintText: undefined,
    placeholder: undefined,
    id: "",
    required: undefined,
    autoComplete: undefined,
  },

  "signatories.beneficiaryCurrentEmployer.signedAt": {
    label: "",
    hintText: undefined,
    placeholder: undefined,
    id: "",
    required: undefined,
    autoComplete: undefined,
  },
  "signatories.beneficiaryCurrentEmployer.role": {
    label: "",
    hintText: undefined,
    placeholder: undefined,
    id: "",
    required: undefined,
    autoComplete: undefined,
  },
  "signatories.beneficiaryRepresentative.signedAt": {
    label: "",
    hintText: undefined,
    placeholder: undefined,
    id: "",
    required: undefined,
    autoComplete: undefined,
  },
  "signatories.beneficiaryRepresentative.role": {
    label: "",
    hintText: undefined,
    placeholder: undefined,
    id: "",
    required: undefined,
    autoComplete: undefined,
  },
  dateValidation: {
    label: "",
    hintText: undefined,
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
