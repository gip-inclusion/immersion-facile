import Button from "@codegouvfr/react-dsfr/Button";
import { ManagedErrorKind, immersionFacileContactEmail } from "shared";
import { routes } from "src/app/routes/routes";
import { ContactErrorInformation, ErrorButton, FrontErrorProps } from "./types";

export const contentsMapper = (
  redirectToConventionWithoutIdentityProviderOnClick: () => void,
  message?: string,
  title?: string,
): Record<ManagedErrorKind, FrontErrorProps> => ({
  peConnectConnectionAborted: {
    title: peConnectErrorKind,
    description:
      "La connexion à France Travail (anciennement Pôle emploi) Connect a été interrompue.",
    subtitle: "Veuillez réessayer.",
    buttons: [redirectToHomePageButtonContent, contactUsButtonContent],
  },
  peConnectNoAuthorisation: {
    subtitle: peConnectErrorKind,
    title:
      "Vous n'avez pas accordé les autorisations nécessaires à Pôle Emploi Connect.",
    description: "",
    buttons: [redirectToHomePageButtonContent, contactUsButtonContent],
  },
  peConnectInvalidGrant: {
    subtitle: peConnectErrorKind,
    title: "Pôle Emploi Connect - Identifiants invalides",
    description:
      "Le code d'autorisation retourné par France Travail ne permet pas d'avoir accès aux droits nécessaires pour lier votre compte.",
    buttons: [
      redirectToConventionWithoutIdentityProvider(
        redirectToConventionWithoutIdentityProviderOnClick,
      ),
      contactUsButtonContent,
    ],
  },
  peConnectAdvisorForbiddenAccess: {
    subtitle: peConnectErrorKind,
    title: "Récupération du conseiller - accès interdit",
    description: `Vous êtes bien authentifiés mais le service France Travail Connect refuse
        la récupération de vos conseillers référents.`,
    buttons: [
      redirectToConventionWithoutIdentityProvider(
        redirectToConventionWithoutIdentityProviderOnClick,
      ),
      contactUsButtonContent,
    ],
  },
  peConnectGetUserInfoForbiddenAccess: {
    subtitle: peConnectErrorKind,
    title: "Récupération des information du bénéficiaire - accès interdit",
    description: peTechnicalTeamForwardDescription,
    buttons: [
      redirectToConventionWithoutIdentityProvider(
        redirectToConventionWithoutIdentityProviderOnClick,
      ),
      contactUsButtonContent,
    ],
  },
  peConnectGetUserStatusInfoForbiddenAccess: {
    subtitle: peConnectErrorKind,
    title:
      "Récupération du statut demandeur d'emploi du bénéficiare - accès interdit",
    description: `Vous êtes bien authentifiés mais le service Pôle Emploi Connect refuse
    la récupération de votre état de demandeur d'emploi.`,
    buttons: [
      redirectToConventionWithoutIdentityProvider(
        redirectToConventionWithoutIdentityProviderOnClick,
      ),
      contactUsButtonContent,
    ],
  },
  unknownError: {
    subtitle: "Erreur inconnue",
    title:
      title ??
      "Une erreur inconnue est survenue. Excusez-nous pour la gène occasionnée.",
    description: message ?? "",
    buttons: [redirectToHomePageButtonContent, contactUsButtonContent],
  },
});

export const redirectToHomePageButtonContent: ErrorButton = (
  <Button
    priority="primary"
    children="Page d'accueil"
    linkProps={{
      ...routes.home().link,
    }}
  />
);

const redirectToConventionWithoutIdentityProvider = (
  onClick: () => void,
): ErrorButton => (
  <Button priority="primary" onClick={onClick}>
    "Vous pouvez quand même remplir votre demande de convention en indiquant
    l'agence France Travail à laquelle vous êtes rattaché ici."
  </Button>
);
export const contactUsButtonContent = ({
  currentUrl,
  currentDate,
  error,
}: ContactErrorInformation) => {
  const emailBody = `%0D%0A________________________%0D%0A
  %0D%0A
  Veuillez répondre au dessus de cette ligne.%0D%0A%0D%0A
  Les infos suivantes peuvent être utiles pour résoudre votre problème :%0D%0A%0D%0A
  - URL de la page concernée : ${currentUrl}%0D%0A%0D%0A
  - Date et heure de l'erreur : ${currentDate}%0D%0A%0D%0A
  - Résumé de l'erreur :%0D%0A%0D%0A
  ${error}
  `;
  return (
    <Button
      priority="secondary"
      children="Contactez-nous"
      linkProps={{
        href: `mailto:${immersionFacileContactEmail}?body=${emailBody}`,
        target: "_blank",
      }}
    />
  );
};

const peConnectErrorKind = "Erreur France Travail Connect";
const peTechnicalTeamForwardDescription =
  "Nous travaillons activement à la résolution de ce problème avec le service technique France Travail (anciennement Pôle emploi).";
