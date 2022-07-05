import React, { useState } from "react";
import { conventionGateway } from "src/app/config/dependencies";
import { routes } from "src/app/routing/routes";

import { Route } from "type-route";
import { Button, Notification } from "react-design-system/immersionFacile";

interface RenewExpiredLinkProps {
  route: Route<typeof routes.renewConventionMagicLink>;
}

interface RenewExpiredLinkContentsProps {
  expiredJwt: string;
  originalURL: string;
}

export const RenewExpiredLinkContent = ({
  expiredJwt,
  originalURL,
}: RenewExpiredLinkContentsProps) => {
  // Flag that tracks if the link renewal had already been requested.
  const [requested, setRequested] = useState(false);
  // Tracks the success of the server request.
  const [requestSuccessful, setRequestSuccessful] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  //eslint-disable-next-line @typescript-eslint/require-await
  const onClick = async () => {
    if (location.search.length === 0) {
      setErrorMessage("URL invalide");
      return;
    }

    if (!expiredJwt) {
      setRequestSuccessful(false);
      setErrorMessage("URL invalide");
      return;
    }

    setRequested(true);
    conventionGateway
      .renewMagicLink(expiredJwt, originalURL)
      .then(() => {
        setRequestSuccessful(true);
      })
      .catch((e) => {
        setErrorMessage(e.message);
        setRequestSuccessful(true);
        setRequested(false);
      });
  };

  return (
    <>
      <div style={{ whiteSpace: "pre-line" }}>
        Votre lien a périmé. Voulez-vous recevoir un nouveau lien ?{" "}
      </div>
      {!requestSuccessful && (
        <Button disable={requested} onSubmit={onClick}>
          Demander un nouveau lien
        </Button>
      )}

      {requestSuccessful && (
        <p>
          Votre demande est enregistrée. Vous recevrez un message avec le
          nouveau lien dans quelques instants.{" "}
        </p>
      )}
      {errorMessage && (
        <Notification
          type="error"
          title="Désolé : nous n'avons pas été en mesure d'enregistrer vos informations. Veuillez réessayer ultérieurement."
        >
          {errorMessage}
        </Notification>
      )}
    </>
  );
};

export const RenewExpiredLinkPage = ({ route }: RenewExpiredLinkProps) => (
  <RenewExpiredLinkContent
    expiredJwt={route.params.expiredJwt}
    originalURL={route.params.originalURL}
  />
);
