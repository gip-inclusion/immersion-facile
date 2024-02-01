import { expiredMagicLinkErrorMessage } from "shared";
import { routes } from "src/app/routes/routes";

export const ShowErrorOrRedirectToRenewMagicLink = ({
  errorMessage,
  jwt,
}: {
  errorMessage: string;
  jwt: string;
}) => {
  // un peu fragile, mais j'attends qu'on remette au carré les erreurs front/back. Ca fait un fix rapide (8/12/2022)
  if (!errorMessage.includes(expiredMagicLinkErrorMessage)) {
    throw new Error(
      `Erreur lors de la récupération de la convention : ${errorMessage}`,
    );
  }
  routes
    .renewConventionMagicLink({
      expiredJwt: jwt,
      originalURL: window.location.href,
    })
    .replace();
  return null;
};
