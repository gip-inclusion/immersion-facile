import { ManagedErrorKind, immersionFacileContactEmail } from "shared";
import { routes } from "src/app/routes/routes";
import {
  ContactErrorInformations,
  ErrorButtonProps,
  HTTPFrontErrorContents,
} from "./types";

export const unexpectedErrorContent = (
  title: string,
  message: string,
): HTTPFrontErrorContents => ({
  overtitle: "Erreur inattendue",
  title:
    "Une erreur inattendue est survenue dans le cadre de votre parcours immersion facilitée.",
  subtitle: title ?? "",
  description: message ?? "",
  buttons: [redirectToHomePageButtonContent, contactUsButtonContent],
});

export const contentsMapper = (
  redirectToConventionWithoutIdentityProviderOnClick: () => void,
  message?: string,
  title?: string,
): Record<ManagedErrorKind, HTTPFrontErrorContents> => ({
  peConnectConnectionAborted: {
    overtitle: peConnectErrorKind,
    title:
      "La connexion à France Travail (anciennement Pôle emploi) Connect a été interrompue.",
    subtitle: "Veuillez réessayer.",
    description: "",
    buttons: [redirectToHomePageButtonContent, contactUsButtonContent],
  },
  peConnectNoAuthorisation: {
    overtitle: peConnectErrorKind,
    title:
      "Vous n'avez pas accordé les autorisations nécessaires à Pôle Emploi Connect.",
    subtitle:
      "Vous avez refusé d'accorder les autorisations nécessaires sur l'interface Pôle Emploi Connect.",
    description:
      "Vous pouvez nous accorder les autorisation nécessaires depuis le portail Pôle Emploi Connect.",
    buttons: [redirectToHomePageButtonContent, contactUsButtonContent],
  },
  peConnectNoValidAdvisor: {
    overtitle: peConnectErrorKind,
    title: "Impossible d'identifier votre conseiller référent",
    subtitle:
      "Les données retournées par France Travail (anciennement Pôle emploi) ne permettent pas d'identifier le conseiller référent qui vous est dédié.",
    description: "",
    buttons: [
      redirectToConventionWithoutIdentityProvider(
        redirectToConventionWithoutIdentityProviderOnClick,
      ),
      contactUsButtonContent,
    ],
  },
  peConnectNoValidUser: {
    overtitle: peConnectErrorKind,
    title:
      "Les données retournées par Pôle Emploi Connect ne permettent pas de vous identifier.",
    subtitle:
      "Les données retournées par France Travail (anciennement Pôle emploi) ne permettent pas de vous identifier.",
    description: "",
    buttons: [
      redirectToConventionWithoutIdentityProvider(
        redirectToConventionWithoutIdentityProviderOnClick,
      ),
      contactUsButtonContent,
    ],
  },
  peConnectInvalidGrant: {
    overtitle: peConnectErrorKind,
    title: "Pôle Emploi Connect - Identifiants invalides",
    subtitle:
      "Le code d'autorisation retourné par France Travail (anciennement Pôle emploi) ne permet pas d'avoir accès aux droits nécessaires pour lier votre compte.",
    description: "",
    buttons: [
      redirectToConventionWithoutIdentityProvider(
        redirectToConventionWithoutIdentityProviderOnClick,
      ),
      contactUsButtonContent,
    ],
  },
  peConnectAdvisorForbiddenAccess: {
    overtitle: peConnectErrorKind,
    title: "Récupération du conseiller - accès interdit",
    subtitle: `Vous êtes bien authentifiés mais le service Pôle Emploi Connect refuse
        la récupération de vos conseillers référents.`,
    description: peTechnicalTeamForwardDescription,
    buttons: [
      redirectToConventionWithoutIdentityProvider(
        redirectToConventionWithoutIdentityProviderOnClick,
      ),
      contactUsButtonContent,
    ],
  },
  peConnectGetUserInfoForbiddenAccess: {
    overtitle: peConnectErrorKind,
    title: "Récupération des information du bénéficiaire - accès interdit",
    subtitle: `Vous êtes bien authentifiés mais le service Pôle Emploi Connect refuse
    la récupération de vos conseillers référents.`,
    description: peTechnicalTeamForwardDescription,
    buttons: [
      redirectToConventionWithoutIdentityProvider(
        redirectToConventionWithoutIdentityProviderOnClick,
      ),
      contactUsButtonContent,
    ],
  },
  peConnectGetUserStatusInfoForbiddenAccess: {
    overtitle: peConnectErrorKind,
    title:
      "Récupération du statut demandeur d'emploi du bénéficiare - accès interdit",
    subtitle: `Vous êtes bien authentifiés mais le service Pôle Emploi Connect refuse
    la récupération de votre état de demandeur d'emploi.`,
    description: peTechnicalTeamForwardDescription,
    buttons: [
      redirectToConventionWithoutIdentityProvider(
        redirectToConventionWithoutIdentityProviderOnClick,
      ),
      contactUsButtonContent,
    ],
  },
  httpUnknownClientError: {
    overtitle: httpClientErrorKind,
    title: "Erreur client inconnue",
    subtitle: title ?? "",
    description: message ?? "",
    buttons: [redirectToHomePageButtonContent, contactUsButtonContent],
  },
  httpClientNotFoundError: {
    overtitle: httpClientErrorKind,
    title: "Page non trouvée - 404",
    subtitle:
      "La page que vous cherchez est introuvable. Excusez-nous pour la gène occasionnée.",
    description: `Si vous avez tapé l'adresse web dans le navigateur, vérifiez qu'elle est correcte. La page n’est peut-être plus disponible.
      <br>Dans ce cas, pour continuer votre visite vous pouvez consulter notre page d’accueil, ou effectuer une recherche avec notre moteur de recherche en haut de page.
      <br>Sinon contactez-nous pour que l’on puisse vous rediriger vers la bonne information.`,
    buttons: [redirectToHomePageButtonContent, contactUsButtonContent],
  },
  httpClientInvalidToken: {
    overtitle: httpClientErrorKind,
    title: "Votre token n'est pas valide.",
    subtitle: title ?? "",
    description: message ?? "",
    buttons: [redirectToHomePageButtonContent, contactUsButtonContent],
  },
  unknownError: {
    overtitle: "Erreur inconnue",
    title:
      "Une erreur inconnue est survenue. Excusez-nous pour la gène occasionnée.",
    subtitle: title ?? "",
    description: message ?? "",
    buttons: [redirectToHomePageButtonContent, contactUsButtonContent],
  },
});

const redirectToHomePageButtonContent: ErrorButtonProps = {
  kind: "primary",
  label: "Page d'accueil",
  ...routes.home().link,
};
const redirectToConventionWithoutIdentityProvider = (
  onClick: () => void,
): ErrorButtonProps => ({
  kind: "primary",
  label:
    "Vous pouvez quand même remplir votre demande de convention en indiquant l'agence France Travail à laquelle vous êtes rattaché ici.",
  onClick,
});

export const contactUsButtonContent = ({
  currentUrl,
  currentDate,
  error,
}: ContactErrorInformations): ErrorButtonProps => {
  const emailBody = `%0D%0A________________________%0D%0A
  %0D%0A
  Veuillez répondre au dessus de cette ligne.%0D%0A%0D%0A
  Les infos suivantes peuvent être utiles pour résoudre votre problème :%0D%0A%0D%0A
  - URL de la page concernée : ${currentUrl}%0D%0A%0D%0A
  - Date et heure de l'erreur : ${currentDate}%0D%0A%0D%0A
  - Résumé de l'erreur :%0D%0A%0D%0A
  ${error}
  `;
  return {
    kind: "secondary",
    label: "Contactez-nous",
    href: `mailto:${immersionFacileContactEmail}?body=${emailBody}`,
    target: "_blank",
  };
};
const httpClientErrorKind = "Erreur Http Client";
const peConnectErrorKind = "Erreur Pôle Emploi Connect";
const peTechnicalTeamForwardDescription =
  "Nous travaillons activement à la résolution de ce problème avec le service technique France Travail (anciennement Pôle emploi).";
