import Button from "@codegouvfr/react-dsfr/Button";
import React from "react";
import { ConventionId, SiretDto, domElementIds } from "shared";
import {
  contactUsButtonContent,
  redirectToHomePageButtonContent,
} from "src/app/contents/error/textSetup";
import { FrontErrorProps } from "src/app/contents/error/types";
import { RenewEstablishmentMagicLinkButton } from "src/app/pages/establishment/RenewEstablishmentMagicLinkButton";

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
        description:
          "La page que vous cherchez est introuvable. Si vous avez tapé l'adresse web dans le navigateur, vérifiez qu'elle est correcte. La page n’est peut-être plus disponible. <br>Dans ce cas, pour continuer votre visite vous pouvez consulter notre page d’accueil, ou effectuer une recherche avec notre moteur de recherche en haut de page.<br>Sinon contactez-nous pour que l’on puisse vous rediriger vers la bonne information.",
        subtitle: "La page que vous cherchez est introuvable.",
        buttons: [redirectToHomePageButtonContent, contactUsButtonContent],
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
        buttons: [redirectToHomePageButtonContent, contactUsButtonContent],
      }),
  },
  establishment: {
    notFound: ({ siret }: { siret?: SiretDto }) => {
      return new FrontSpecificError({
        title: "Établissment non trouvé",
        description: `Nous n'avons trouvé aucun établissement ${
          siret ? `avec le siret ${siret}` : ""
        }.`,
        buttons: siret
          ? [
              <RenewEstablishmentMagicLinkButton
                id={domElementIds.establishment.edit.refreshEditLink}
                siret={siret}
              />,
            ]
          : [redirectToHomePageButtonContent, contactUsButtonContent],
      });
    },
    expiredLink: ({ jwt, siret }: { jwt: string; siret: SiretDto }) => {
      return new FrontSpecificError({
        title: "Lien périmé",
        description: `Le jwt : ${jwt} pour accéder au siret ${siret} est périmé...`,
        buttons: [
          <RenewEstablishmentMagicLinkButton
            id={domElementIds.establishment.edit.refreshEditLink}
            siret={siret}
          />,
        ],
      });
    },
  },
};
