import { routes } from "src/app/routes/routes";
import { HTTPFrontErrorContents } from "./types";

export const contents404: HTTPFrontErrorContents = {
  overtitle: "Page non trouvée",
  title: "Erreur 404",
  subtitle:
    "La page que vous cherchez est introuvable. Excusez-nous pour la gène occasionnée.",
  description: `Si vous avez tapé l'adresse web dans le navigateur, vérifiez qu'elle est correcte. La page n’est peut-être plus disponible.
    <br>Dans ce cas, pour continuer votre visite vous pouvez consulter notre page d’accueil, ou effectuer une recherche avec notre moteur de recherche en haut de page.
    <br>Sinon contactez-nous pour que l’on puisse vous rediriger vers la bonne information.`,
  buttons: [
    {
      type: "primary",
      label: "Page d'accueil",
      ...routes.home().link,
    },
    {
      type: "secondary",
      label: "Page d'accueil",
      href: "mailto:contact@immersion-facile.beta.gouv.fr",
    },
  ],
};
