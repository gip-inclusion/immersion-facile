import { mergeDeepRight } from "ramda";
import React from "react";
import {
  immersionTexts,
  ConventionTexts,
} from "src/app/contents/forms/convention/immersionTexts";

export const miniStageTexts: ConventionTexts = mergeDeepRight(immersionTexts, {
  intro: {
    conventionTitle: "S’informer sur les métiers, découvrir l’entreprise",
    welcome: (
      <>
        <strong>Bravo !</strong>
        <p className="fr-text">
          Vous avez trouvé une entreprise pour vous accueillir en stage et
          découvrir un ou plusieurs métiers.
          <br />
          Avant tout, vous devez faire établir une convention de stage pendant
          les vacances scolaires et bien c'est ici que ça se passe. <br />
          En quelques minutes, complétez ce formulaire de convention avec
          l'entreprise qui vous accueillera.
        </p>
      </>
    ),
    conventionWelcomeNotification: (
      <>
        <strong>
          Attention, le formulaire de demande de convention est déployé
          uniquement en Bretagne et Pays de Loire
        </strong>
        <br />
        <p className="fr-text--xs fr-mt-1w">
          La convention doit être établie, signée par toutes les parties et
          visée par la Chambre de Commerce et d’Industrie <u>avant</u> le
          démarrage de la période d’observation en milieu professionnel. Sans
          visa, la convention ne pourra être exécutée.
          <br />
          <br />
          Cette convention est établie en application des dispositions des
          articles L124-3-1, L332-3-1 et L332-3-2 du code de l’éducation et de
          l’article L.4153-1 du code du travail, offrant la possibilité:
          <br />
          ⦁ aux jeunes des deux derniers niveaux d’enseignement des collèges ou
          aux jeunes des lycées de réaliser des périodes d’observation en
          entreprise d’une durée maximale d’une semaine durant les vacances
          scolaires;
          <br />⦁ aux étudiants de l’enseignement supérieur de réaliser des
          périodes d’observation en entreprise d’une durée maximale d’une
          semaine, en dehors des semaines réservées aux cours et au contrôle de
          connaissances.
        </p>
      </>
    ),
  },
  agencySection: {
    title: "Pour commencer",
    yourAgencyLabel:
      "Choisissez le Point orientation de la chambre de commerce et d’industrie près de chez vous !",
    yourPostalcodeLabel:
      "Saisissez le code postal de votre entreprise d’accueil",
  },
  beneficiarySection: {
    title: "1. Vos coordinnées",
    phone: {
      description: "pour qu’on puisse vous contacter à propos du stage",
    },
    isMinorLabel: "Etes vous mineur ou majeur protégé ?",
    beneficiaryRepresentative: {
      phone: {
        description: "pour qu’on puisse vous contacter à propos du stage",
      },
    },
  },
  establishmentSection: {
    subtitle:
      "Les questions suivantes doivent être complétées avec la personne qui vous accueillera pendant votre stage",
    siret: {
      description: "la structure d'accueil, où vous allez faire votre stage",
      label:
        "Indiquez le SIRET de l’entreprise où vous allez faire votre stage",
    },
    businessNameLabel: "Indiquez le nom (raison sociale) de votre entreprise",
    establishmentTutor: {
      phone: {
        label: "Indiquez le numéro de téléphone du tuteur ou de l’entreprise",
        description: "pour qu’on puisse vous contacter à propos du stage",
      },
    },
    establishmentRepresentative: {
      phone: {
        description: "pour qu’on puisse vous contacter à propos du stage",
      },
    },
  },
  immersionConditionsSection: {
    title: "3. Conditions d’accueil du stage",
    dateStartLabel: "Date de début du stage",
    dateEndLabel: "Date de fin du stage",
    workConditions: {
      label:
        "Conditions de travail, propres  au métier observé pendant le stage ",
    },
    immersionAddressLabel: "Adresse du lieu où se fera le stage",
    individualProtectionLabel:
      "Un équipement de protection individuelle est-il fourni pour le stage",
    immersionActivities: {
      label: "Activités observées / pratiquées pendant le stage",
    },
    profession: {
      label: "Intitulé du métier observé pendant le stage",
    },
    sanitaryPreventionLabel:
      "Des mesures de prévention sanitaire sont-elles prévues pour le stage ?",
    immersionSkills: {
      label: "Compétences/aptitudes observées / évaluées pendant le stage",
    },
  },
  conventionAlreadySigned: "Vous avez déjà signé cette demande de stage.",
  conventionReadyToBeSigned: "Cette demande de stage est prête à être signée.",
  conventionNotEditable: "Cette demande de stage n'est plus modifiable.",
});
