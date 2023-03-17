import { routes } from "src/app/routes/routes";

export const ShowErrorOrRedirectToRenewMagicLink = ({
  errorMessage,
  jwt,
}: {
  errorMessage: string;
  jwt: string;
}) => {
  // un peu fragile, mais j'attends qu'on remette au carré les erreurs front/back. Ca fait un fix rapide (8/12/2022)
  if (errorMessage.includes("Le lien magique est périmé")) {
    routes
      .renewConventionMagicLink({
        expiredJwt: jwt,
        originalURL: window.location.href,
      })
      .replace();
    return null;
  }

  routes
    .errorRedirect({
      title: "Erreur lors de la récupération de la convention",
      message: errorMessage,
      kind: "",
    })
    .push();
  return null;
};
