import { expiredMagicLinkErrorMessage, type OAuthState } from "shared";
import { routes } from "src/app/routes/routes";

//TODO a voir pour le state sur le jwt EmailAuthCode
export const ShowErrorOrRedirectToRenewMagicLink = ({
  errorMessage,
  jwt,
  state,
}: {
  errorMessage: string;
  jwt: string;
  state?: OAuthState;
}) => {
  // un peu fragile, mais j'attends qu'on remette au carré les erreurs front/back. Ca fait un fix rapide (8/12/2022)
  if (!errorMessage.includes(expiredMagicLinkErrorMessage)) {
    throw new Error(
      `Erreur lors de la récupération de la convention : ${errorMessage}`,
    );
  }
  routes
    .renewJwt({
      expiredJwt: jwt,
      originalUrl: window.location.href,
      state,
    })
    .replace();
  return null;
};
