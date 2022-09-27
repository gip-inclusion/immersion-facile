import {
  immersionTexts,
  Texts,
} from "src/app/pages/Convention/texts/immersionTexts";
import React from "react";
import { mergeDeepRight } from "ramda";

export const miniStageTexts: Texts = mergeDeepRight(immersionTexts, {
  welcome: (
    <>
      Bravo ! <br />
      Vous avez trouvé une entreprise pour vous accueillir en mini stage. <br />
      Avant tout, vous devez faire établir une convention pour ce stage et c'est
      ici que ça se passe. <br />
      En quelques minutes, complétez ce formulaire avec l'entreprise qui vous
      accueillera. <br />
    </>
  ),
  sectionTitles: {
    conditionsToHost: "3. Conditions d’accueil du stage",
  },
  conventionTitle: "Formulaire pour conventionner un mini stage",
  notDeployedEveryWhere:
    "Attention, le formulaire de demande de mini stage n'est pas encore déployé partout en France.",
  conventionAlreadySigned: "Vous avez déjà signé cette demande de stage.",
  conventionReadyToBeSigned: "Cette demande de stage est prête à être signée.",
  conventionNotEditable: "Cette demande de stage n'est plus modifiable.",
  beneficiary: {
    phone: {
      description: "pour qu’on puisse vous contacter à propos du stage",
    },
  },
  legalRepresentative: {
    phone: {
      description: "pour qu’on puisse vous contacter à propos du stage",
    },
  },
  establishment: {
    siret: {
      description: "la structure d'accueil, où vous allez faire votre stage",
    },
    phone: {
      description: "pour qu’on puisse vous contacter à propos du stage",
    },
  },
  immersionConditionsCommonFields: {
    dateStartLabel: "Date de début du stage",
    dateEndLabel: "Date de fin du stage",
    workConditions: {
      label:
        "Conditions de travail, propres  au métier observé pendant le stage ",
    },
    immersionAddressLabel: "Adresse du lieu où se fera le stage",
    individualProtectionLabel:
      "Un équipement de protection individuelle est-il fourni pur le stage",
    immersionActivities: {
      label: "Activités observées / pratiquées pendant le stage",
    },
    immersionSkills: {
      label: "Compétences/aptitudes observées / évaluées pendant le stage",
    },
  },
});
