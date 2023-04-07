import React from "react";
import { InternshipKind } from "shared";
import { fr } from "@codegouvfr/react-dsfr";

export const useConventionTexts = (internshipKind: InternshipKind) =>
  immersionTexts(internshipKind);

const immersionTexts = (internshipKind: InternshipKind) => ({
  intro: {
    conventionTitle:
      internshipKind === "immersion"
        ? "Formulaire pour conventionner une période de mise en situation professionnelle (PMSMP)"
        : "S’informer sur les métiers, découvrir l’entreprise",
    welcome:
      internshipKind === "immersion" ? (
        <>
          <strong>Bravo !</strong>
          <p className="fr-text">
            Vous avez trouvé votre entreprise accueillante. Complétez ce
            formulaire avec votre entreprise accueillante et initiez une
            convention pour réaliser votre immersion professionnelle.
          </p>
          <p className={fr.cx("fr-text--xs", "fr-mt-1w")}>
            Ce formulaire vaut équivalence du CERFA 13912 * 04
          </p>
        </>
      ) : (
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
    conventionWelcomeNotification:
      internshipKind === "immersion" ? (
        <>
          <p>
            Vérifiez que votre structure d’accompagnement est disponible dans la
            liste ci-dessous.{" "}
            <strong>Si ce n’est pas le cas, contactez votre conseiller.</strong>
          </p>
          <p>
            <strong>
              Si vous n'avez pas de structure d'accompagnement, retrouvez{" "}
              <a
                href="https://aide.immersion-facile.beta.gouv.fr/fr/article/je-nai-pas-de-structure-daccompagnement-et-je-veux-faire-une-immersion-1x15rdp"
                target="_blank"
              >
                nos conseils ici
              </a>
              .
            </strong>
          </p>
        </>
      ) : (
        <>
          <strong>
            Attention, le formulaire de demande de convention est déployé
            uniquement en Bretagne et Pays de Loire
          </strong>
          <br />
          <p className={fr.cx("fr-text--xs", "fr-mt-1w")}>
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
            ⦁ aux jeunes des deux derniers niveaux d’enseignement des collèges
            ou aux jeunes des lycées de réaliser des périodes d’observation en
            entreprise d’une durée maximale d’une semaine durant les vacances
            scolaires;
            <br />⦁ aux étudiants de l’enseignement supérieur de réaliser des
            périodes d’observation en entreprise d’une durée maximale d’une
            semaine, en dehors des semaines réservées aux cours et au contrôle
            de connaissances.
          </p>
        </>
      ),
  },
  agencySection: {
    title:
      internshipKind === "immersion"
        ? "Pour commencer nous avons besoin de"
        : "Pour commencer",
  },
  beneficiarySection: {
    title:
      internshipKind === "immersion"
        ? "1. Informations du candidat"
        : "1. Vos coordonnées",
    isMinorLabel:
      internshipKind === "immersion"
        ? "La personne qui va faire l'immersion est-elle mineure ?"
        : "Etes vous mineur ou majeur protégé ?",
  },
  establishmentSection: {
    title: "2. Coordonnées de l'entreprise",
    subtitle:
      internshipKind === "immersion"
        ? "Les questions suivantes doivent être complétées avec la personne qui vous accueillera pendant votre immersion"
        : "Les questions suivantes doivent être complétées avec la personne qui vous accueillera pendant votre stage",
    isEstablishmentTutorIsEstablishmentRepresentative:
      "Est-ce que le tuteur de l'entreprise est le représentant de l'entreprise, signataire de la convention ?",
  },
  immersionConditionsSection: {
    title:
      internshipKind === "immersion"
        ? "3. Conditions d’accueil de l’immersion professionnelle"
        : "3. Conditions d’accueil du stage",
  },
  yes: "Oui",
  no: "Non",
  copyLinkTooltip: "Copier le lien pour partager le formulaire",
  linkCopied: "Lien copié !",
  shareLinkByMail: {
    share: "Partagez cette demande de convention par e-mail",
    sharedSuccessfully:
      "Cette demande de convention a bien été partagée par mail.",
    errorWhileSharing: "Erreur lors de l'envoi de l'email",
  },
  signatures: {
    fixErrors: "Veuillez corriger les champs erronés",
    validationText:
      "Une fois le formulaire envoyé, vous allez recevoir une demande de confirmation par mail et l'entreprise également",
  },
  conventionAlreadySigned:
    internshipKind === "immersion"
      ? "Vous avez signé cette convention."
      : "Vous avez signé cette demande de stage.",
  conventionReadyToBeSigned:
    internshipKind === "immersion"
      ? "Cette demande d'immersion est prête à être signée."
      : "Cette demande de stage est prête à être signée.",
  conventionToSignOrAskForChanges:
    "Veuillez la signer ou la renvoyer pour modification.",
  conventionNotEditable:
    internshipKind === "immersion"
      ? "Cette demande d'immersion n'est plus modifiable."
      : "Cette demande de stage n'est plus modifiable.",
  verification: {
    rejectConvention: "Refuser l'immersion",
    modifyConvention: "Renvoyer au bénéficiaire pour modification",
    conventionAlreadyMarkedAsEligible: "Demande déjà validée.",
    markAsEligible: "Marquer la demande comme éligible",
    conventionAlreadyValidated: "Demande déjà validée",
    markAsValidated: "Valider la demande",
    markAsCancelled: "Annuler la demande",
    conventionAlreadyCancelled: "Demande déjà annulée.",
  },
  sign: {
    title:
      internshipKind === "immersion"
        ? "Formulaire pour conventionner une période de mise en situation professionnelle (PMSMP)"
        : "Formulaire pour conventionner un mini stage",
    summary: `Voici la demande de convention qui vient d'être complétée. <br />
    Relisez la bien et si cela vous convient, signez la avec le bouton "je
    signe cette demande"`,
    regulations:
      internshipKind === "immersion"
        ? "Ce formulaire vaut équivalence du CERFA 13912 * 04"
        : "",
    rejected: {
      title:
        internshipKind === "immersion"
          ? "Désolé : votre demande d'immersion a été refusée"
          : "Désolé : votre demande de mini stage a été refusée",
      detail:
        internshipKind === "immersion"
          ? "Votre demande d'immersion a été refusée. Vous avez reçu un mail vous en donnant les raisons."
          : "Votre demande de mini stage a été refusée. Vous avez reçu un mail vous en donnant les raisons.",
      contact: "Veuillez contacter votre conseiller pour plus d'informations.",
    },
    needsModification: {
      title:
        internshipKind === "immersion"
          ? "Des modifications ont été demandées sur votre demande"
          : "Des modifications ont été demandées sur votre demande",
      detail:
        internshipKind === "immersion"
          ? "Vous ne pouvez pas encore signer votre demande d'immersion car des modifications ont été réclamées par votre conseiller (Vous avez reçu un mail précisant les changements à effectuer)."
          : "Vous ne pouvez pas encore signer votre demande de mini stage car des modifications ont été réclamées par votre conseiller (Vous avez reçu un mail précisant les changements à effectuer).",
      editionLink: "Cliquez ici pour aller à la page d'édition",
    },
  },
});
