import Button from "@codegouvfr/react-dsfr/Button";
import {
  type ConventionId,
  domElementIds,
  immersionFacileContactEmail,
  type SiretDto,
} from "shared";
import type {
  ContactErrorInformation,
  ErrorButton,
  FrontErrorProps,
} from "src/app/contents/error/types";
import { routes } from "src/app/routes/routes";

export class FrontSpecificError extends Error {
  public props: FrontErrorProps;

  constructor(props: FrontErrorProps) {
    super();
    this.props = props;
  }
}

export const frontErrors = {
  generic: {
    pageNotFound: () =>
      new FrontSpecificError({
        title: "Page non trouvé",
        subtitle: "La page que vous cherchez est introuvable.",
        description:
          "La page que vous cherchez est introuvable. Si vous avez tapé l'adresse web dans le navigateur, vérifiez qu'elle est correcte. La page n’est peut-être plus disponible. <br>Dans ce cas, pour continuer votre visite vous pouvez consulter notre page d’accueil, ou effectuer une recherche avec notre moteur de recherche en haut de page.<br>Sinon contactez-nous pour que l’on puisse vous rediriger vers la bonne information.",
        buttons: [HomeButton, ContactUsButton],
      }),
    unauthorized: () =>
      new FrontSpecificError({
        title: "Non-autorisé",
        description: "Vous n'êtes pas autorisé à accéder à cette page.",
        buttons: [HomeButton, ContactUsButton],
      }),
  },
  convention: {
    cancelled: ({
      conventionId,
      justificationStatus,
      agencyName,
    }: {
      conventionId: ConventionId;
      justificationStatus?: string;
      agencyName: string;
    }) =>
      new FrontSpecificError({
        title: "Demande annulée",
        subtitle: `La demande de convention ${conventionId} n'est plus accessible.`,
        description: `${
          justificationStatus
            ? `Elle a été annulée pour le motif suivant : ${justificationStatus}<br><br>`
            : ""
        } Merci de vous rapprocher de votre conseiller. Pour rappel, l'agence indiquée sur votre convention était : ${agencyName}.`,
        buttons: [
          <Button
            key={"im-error__faq-button"}
            linkProps={{
              href: "https://immersion-facile.beta.gouv.fr/aide/",
              target: "_blank",
            }}
          >
            Accéder à la FAQ
          </Button>,
        ],
      }),
    externalConsumerNotFound: ({ consumerName }: { consumerName: string }) =>
      new FrontSpecificError({
        title: "Partenaire inconnu",
        description: `Nous n'avons aucun partenaire avec le nom : ${consumerName}. Veuillez vérifier l'orthographe.`,
        buttons: [HomeButton, ContactUsButton],
      }),
  },
  establishment: {
    notFound: ({ siret }: { siret?: SiretDto }) => {
      return new FrontSpecificError({
        title: "Établissment non trouvé",
        description: `Nous n'avons trouvé aucun établissement ${
          siret ? `avec le siret ${siret}` : ""
        }.`,
        buttons: [HomeButton, ContactUsButton],
      });
    },
    expiredLink: () => {
      return new FrontSpecificError({
        title: "Lien périmé",
        description: `Nous n'utilisons plus de lien magique pour vous permettre de modifier votre fiche établissement. Pour effectuer cette action, connectez-vous à votre espace entreprise.`,
        buttons: [EstablishmentDashboardButton],
      });
    },
  },
};

const EstablishmentDashboardButton: ErrorButton = (
  <Button
    priority="primary"
    linkProps={{
      ...routes.establishmentDashboard().link,
      id: domElementIds.error.establishmentDashboardButton,
    }}
  >
    Accéder à mon espace entreprise
  </Button>
);

const HomeButton: ErrorButton = (
  <Button
    priority="primary"
    linkProps={{
      ...routes.home().link,
      id: domElementIds.error.homeButton,
    }}
  >
    Page d'accueil
  </Button>
);

export const ContactUsButton = ({
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
      linkProps={{
        href: `mailto:${immersionFacileContactEmail}?body=${emailBody}`,
        target: "_blank",
        id: domElementIds.error.contactUsButton,
      }}
    >
      Contactez-nous
    </Button>
  );
};
