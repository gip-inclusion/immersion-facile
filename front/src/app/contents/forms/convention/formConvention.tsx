import { keys, mergeRight } from "ramda";
import React from "react";
import { InternshipKind, domElementIds } from "shared";
import { ConventionField } from "../../admin/types";
import { FormFieldAttributesForContent } from "../types";

export type FormFieldsObjectForContent<T> = Record<
  keyof T,
  FormFieldAttributesForContent
>;

// Remove and replace by ConventionField when postalCode is removed from ConventionDTO
type ConventionFieldWithoutPostalCode = Exclude<ConventionField, "postalCode">;

export type FormFieldKeys =
  | ConventionFieldWithoutPostalCode
  | "isCurrentEmployer"
  | "isEstablishmentTutorIsEstablishmentRepresentative"
  | "isMinor"
  | "agencyKind";

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
  ...establishmentRepresentativeSection(),
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
  agencyKind: {
    label: "Votre type de structure d'accompagnement",
    id: conventionSectionIds.agencyKind,
    required: false,
  },
  agencyId: {
    label:
      internshipKind === "immersion"
        ? "Votre structure d'accompagnement"
        : "Choisissez le Point Orientation de la chambre de commerce et d’industrie proche de votre entreprise !",
    id: conventionSectionIds.agencyId,
    required: true,
    placeholder:
      internshipKind === "immersion"
        ? "Veuillez sélectionner une structure d'accompagnement"
        : "Veuillez sélectionner un point orientation",
  },
  agencyRefersTo: {
    label: "Votre structure prescriptrice",
    id: "",
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
        ? "SIRET de la structure d'accueil"
        : "SIRET de l’entreprise où vous allez faire votre stage",
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
        ? "Nom (raison sociale) de l'établissement d'accueil"
        : "Nom (raison sociale) de votre entreprise",
    id: conventionSectionIds.businessName,
    required: true,
  },
  workConditions: {
    label:
      internshipKind === "immersion"
        ? "Conditions de travail, propres au métier observé pendant l’immersion "
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
    hintText: "Mesures de prévention sanitaire prévues pour l’immersion",
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
    hintText:
      "Précisez les éléments clefs de la période, son contexte, les tâches confiées, les objectifs assignés au bénéficiaire.",
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
    hintText: (
      <>
        <a
          href="https://immersion-facile.beta.gouv.fr/aide/article/est-il-possible-de-realiser-une-immersion-lorsque-lon-est-en-activite-1yb59te/"
          target="_blank"
          rel="noreferrer"
        >
          Dans quelles situations puis-je faire une immersion pendant mon temps
          de travail ?
        </a>
      </>
    ),
  },
  isEstablishmentTutorIsEstablishmentRepresentative: {
    label: `Qui sera le tuteur du candidat durant son ${
      internshipKind === "immersion" ? "immersion" : "stage"
    } ?`,
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
    label: "Êtes-vous majeur protégé ?",
    id: conventionSectionIds.isMinor,
    required: true,
  },
  schedule: {
    label: `Dates et horaires ${
      internshipKind === "immersion" ? "de l'immersion" : "du stage"
    }`,
    id: "",
  },
});

const beneficiarySection = (internshipKind: InternshipKind) => ({
  "signatories.beneficiary.firstName": {
    label: "Prénom du candidat",
    id: beneficiarySectionIds.firstName,
    required: true,
  },
  "signatories.beneficiary.lastName": {
    label: "Nom de famille du candidat",
    id: beneficiarySectionIds.lastName,
    required: true,
  },
  "signatories.beneficiary.birthdate": {
    label: "Date de naissance du candidat",
    id: beneficiarySectionIds.birthdate,
    required: true,
  },
  "signatories.beneficiary.email": {
    label: "E-mail du candidat",
    id: beneficiarySectionIds.email,
    required: true,
    placeholder: "nom@exemple.com",
    hintText:
      "cela nous permet de vous transmettre la validation de la convention",
  },
  "signatories.beneficiary.phone": {
    label: "Téléphone du candidat",
    hintText:
      internshipKind === "immersion"
        ? "pour qu’on puisse vous contacter à propos de l’immersion"
        : "pour qu’on puisse vous contacter à propos du stage",
    placeholder: "0605040302",
    id: beneficiarySectionIds.phone,
    required: true,
  },
  "signatories.beneficiary.levelOfEducation": {
    label: "Classe actuelle fréquentée par le candidat",
    id: beneficiarySectionIds.levelOfEducation,
    placeholder: "Précisez votre statut",
    required: true,
  },
  "signatories.beneficiary.financiaryHelp": {
    label: "Aide matérielle",
    id: beneficiarySectionIds.financiaryHelp,
    placeholder: "Ex : aide à la mobilité (optionnel)",
    hintText:
      "Le bénéficiaire a-t-il besoin d'une aide matérielle pour réaliser l'immersion ? Les aides sont soumises à des conditions de ressources. Renseignez-vous auprès de votre conseiller.",
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
  "signatories.beneficiary.address": {
    label: "Adresse du candidat",
    id: beneficiarySectionIds.address,
    placeholder: "Ex : 10 Rue de la Paix, 75001 Paris",
    required: true,
  },
  "signatories.beneficiary.schoolName": {
    label: "Nom de l'établissement scolaire du candidat",
    id: beneficiarySectionIds.schoolName,
    placeholder: "Ex : Lycée Jean Moulin",
    required: true,
  },
  "signatories.beneficiary.schoolPostcode": {
    label: "Code postal de l'établissement scolaire du candidat",
    id: beneficiarySectionIds.schoolPostcode,
    placeholder: "Ex : 06530",
    required: true,
  },
  "signatories.beneficiary.isRqth": {
    label:
      "Le candidat a une reconnaissance travailleur handicapé (RQTH) ou équivalent ",
    id: beneficiarySectionIds.isRqth,
    hintText: (
      <>
        Il n'est pas obligatoire de le préciser, mais cela peut être utile au
        candidat et à l'entreprise.
      </>
    ),
  },
});

const establishmentTutorSection = (internshipKind: InternshipKind) => ({
  "establishmentTutor.firstName": {
    label: "Prénom du tuteur",
    hintText: "Ex : Alain",
    id: establishmentTutorSectionIds.firstName,
    required: true,
  },
  "establishmentTutor.lastName": {
    label: "Nom du tuteur",
    hintText: "Ex : Prost",
    id: establishmentTutorSectionIds.lastName,
    required: true,
  },
  "establishmentTutor.email": {
    label: "Email du tuteur",
    hintText:
      "Le tuteur recevra une copie de la convention à cette adresse email. Pensez à bien vérifier son exactitude. Ex: nom@domain.com",
    id: establishmentTutorSectionIds.email,
    required: true,
  },
  "establishmentTutor.phone": {
    label:
      internshipKind === "immersion"
        ? "Numéro de téléphone du tuteur ou de la structure d'accueil"
        : "Numéro de téléphone du tuteur ou de l’entreprise",
    hintText:
      "Renseignez de préférence un téléphone portable pour recevoir une copie de la convention par SMS. Ex: 0605040302",
    id: establishmentTutorSectionIds.phone,
    required: true,
  },
  "establishmentTutor.job": {
    label: "Fonction du tuteur",
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
    label: "Téléphone du représentant légal",
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
    label: "Raison sociale de l'entreprise actuelle du candidat",
    id: beneficiaryCurrentEmployerSectionIds.businessName,
    required: true,
  },
  "signatories.beneficiaryCurrentEmployer.job": {
    label: "Fonction du signataire dans l'entreprise actuelle du candidat",
    id: beneficiaryCurrentEmployerSectionIds.job,
  },
  "signatories.beneficiaryCurrentEmployer.email": {
    label: "E-mail de l'entreprise actuelle du candidat",
    id: beneficiaryCurrentEmployerSectionIds.email,
    required: true,
  },
  "signatories.beneficiaryCurrentEmployer.phone": {
    label: "Téléphone de l'entreprise actuelle du candidat",
    id: beneficiaryCurrentEmployerSectionIds.phone,
    required: true,
  },
  "signatories.beneficiaryCurrentEmployer.firstName": {
    label: "Prénom du signataire dans l'entreprise actuelle du candidat",
    id: beneficiaryCurrentEmployerSectionIds.firstName,
    required: true,
  },
  "signatories.beneficiaryCurrentEmployer.lastName": {
    label:
      "Nom de famille du signataire dans l'entreprise actuelle du candidat",
    id: beneficiaryCurrentEmployerSectionIds.lastName,
    required: true,
  },
  "signatories.beneficiaryCurrentEmployer.businessSiret": {
    label: "Siret de l'entreprise actuelle du candidat",
    id: beneficiaryCurrentEmployerSectionIds.businessSiret,
    required: true,
  },
  "signatories.beneficiaryCurrentEmployer.businessAddress": {
    label: "Addresse de l'entreprise actuelle du candidat",
    id: beneficiaryCurrentEmployerSectionIds.businessAddress,
    required: true,
  },
};

const establishmentRepresentativeSection = () => ({
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
    hintText:
      "Cette adresse email sera utilisée dans le cadre de la signature de la convention. Pensez à bien vérifier son exactitude. Ex: nom@domain.com",
    id: establishmentRepresentativeSectionIds.email,
    required: true,
  },
  "signatories.establishmentRepresentative.phone": {
    label: "Indiquez le numéro de téléphone du représentant de l'entreprise",
    hintText:
      "Renseignez de préférence un téléphone portable pour signer la convention par SMS. Ex: 0605040302",
    id: establishmentRepresentativeSectionIds.phone,
    required: true,
  },
});

const fieldsToExclude = {
  agencyCounsellorEmails: {
    label: "",
    id: "",
  },
  agencyValidatorEmails: {
    label: "",
    id: "",
  },
  "agencyRefersTo.id": {
    label: "",
    id: "",
  },
  "agencyRefersTo.name": {
    label: "",
    id: "",
  },
  "agencyRefersTo.kind": {
    label: "",
    id: "",
  },
  agencySiret: {
    label: "",
    id: "",
  },
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
  dateApproval: {
    label: "",
    hintText: undefined,
    placeholder: undefined,
    id: "",
    required: undefined,
    autoComplete: undefined,
  },

  validators: {
    label: "",
    id: "",
  },
  renewed: {
    label: "",
    id: "",
  },
  "renewed.from": {
    label: "",
    id: "",
  },
  "renewed.justification": {
    label: "",
    id: "",
  },
  acquisitionKeyword: {
    label: "",
    id: "",
  },
  acquisitionCampaign: {
    label: "",
    id: "",
  },
  establishmentNumberEmployeesRange: {
    label: "",
    id: "",
  },
};

type SidebarStepContent = {
  title: string;
  description: React.ReactNode;
};

export const sidebarStepContent = (
  internshipKind: InternshipKind,
): SidebarStepContent[] => {
  const contents = {
    immersion: [
      {
        title: "Informations sur la structure d'accompagnement du candidat",
        description: (
          <>
            <p>
              Vérifiez que votre structure d’accompagnement est disponible dans
              la liste ci-dessous.{" "}
              <strong>
                Si ce n’est pas le cas, contactez votre conseiller.
              </strong>
            </p>
            <p>
              <strong>
                Si vous n'avez pas de structure d'accompagnement, retrouvez{" "}
                <a
                  href="https://immersion-facile.beta.gouv.fr/aide/article/je-nai-pas-de-structure-daccompagnement-et-je-veux-faire-une-immersion-1x15rdp/"
                  target="_blank"
                  rel="noreferrer"
                >
                  nos conseils ici
                </a>
                .
              </strong>
            </p>
          </>
        ),
      },
      {
        title: "Informations sur le candidat",
        description: (
          <>
            <p>
              Les informations de contact (email, téléphone) seront uniquement
              utilisées pour valider la convention avec l’entreprise et
              l’organisme d’accompagnement.
            </p>
            <p>
              <strong>
                Renseignez de préférence{" "}
                <strong>un numéro de téléphone portable</strong> pour recevoir
                les informations urgentes concernant la convention par SMS.
              </strong>
            </p>
          </>
        ),
      },
      {
        title: "Informations sur l'entreprise",
        description: (
          <>
            <p>
              Les informations de contact (email, téléphone) seront uniquement
              utilisées pour valider la convention avec l’entreprise et
              l’organisme d’accompagnement.
            </p>
            <p>
              <strong>
                Renseignez de préférence{" "}
                <strong>un numéro de téléphone portable</strong> pour recevoir
                les informations urgentes concernant la convention par SMS.
              </strong>
            </p>
          </>
        ),
      },
      {
        title: "Lieu et heures de l'immersion professionnelle",
        description: <></>,
      },
      {
        title: "Détails de l'immersion professionnelle",
        description: (
          <p>
            <strong>
              Consultez les{" "}
              <a
                href="https://immersion-facile.beta.gouv.fr/aide/article/quelles-sont-les-obligations-a-respecter-pour-une-immersion-1bl944v/?bust=1690274462053"
                rel="noreferrer"
                target="_blank"
              >
                conditions réglementaires
              </a>
              applicables aux immersions.
            </strong>
          </p>
        ),
      },
    ],
    "mini-stage-cci": [
      {
        title: "Informations sur la structure d'accompagnement du candidat",
        description: (
          <>
            <p>
              Vérifiez que votre structure d’accompagnement est disponible dans
              la liste ci-dessous.{" "}
              <strong>
                Si ce n’est pas le cas, contactez votre conseiller.
              </strong>
            </p>
            <p>
              <strong>
                Si vous n'avez pas de structure d'accompagnement, retrouvez{" "}
                <a
                  href="https://immersion-facile.beta.gouv.fr/aide/article/je-nai-pas-de-structure-daccompagnement-et-je-veux-faire-une-immersion-1x15rdp/"
                  target="_blank"
                  rel="noreferrer"
                >
                  nos conseils ici
                </a>
                .
              </strong>
            </p>
          </>
        ),
      },
      {
        title: "Informations sur le candidat",
        description: (
          <>
            <p>
              Les informations de contact (email, téléphone) seront uniquement
              utilisées pour valider la convention avec l’entreprise et
              l’organisme d’accompagnement.
            </p>
            <p>
              <strong>
                Renseignez de préférence{" "}
                <strong>un numéro de téléphone portable</strong> pour recevoir
                les informations urgentes concernant la convention par SMS.
              </strong>
            </p>
          </>
        ),
      },
      {
        title: "Informations sur l'entreprise",
        description: (
          <>
            <p>
              Les informations de contact (email, téléphone) seront uniquement
              utilisées pour valider la convention avec l’entreprise et
              l’organisme d’accompagnement.
            </p>
            <p>
              <strong>
                Renseignez de préférence{" "}
                <strong>un numéro de téléphone portable</strong> pour recevoir
                les informations urgentes concernant la convention par SMS.
              </strong>
            </p>
          </>
        ),
      },
      {
        title: "Lieu et heures de l'immersion professionnelle",
        description: <></>,
      },
      {
        title: "Détails de l'immersion professionnelle",
        description: <></>,
      },
    ],
  };
  return contents[internshipKind];
};

export const formUiSections: Partial<FormFieldKeys>[][] = [
  ["agencyId"],
  keys(beneficiarySection("immersion")),
  [
    ...keys(
      mergeRight(
        establishmentRepresentativeSection(),
        establishmentTutorSection("immersion"),
      ),
    ),
    "siret",
    "businessName",
  ],
  ["dateStart", "dateEnd", "schedule", "immersionAddress"],
  [
    "individualProtection",
    "sanitaryPrevention",
    "immersionObjective",
    "immersionAppellation",
    "immersionActivities",
  ],
];
