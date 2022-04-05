import React, { useState } from "react";
import { routes } from "src/app/routing/routes";
import { Button } from "src/uiComponents/Button";
import { ErrorMessage } from "src/uiComponents/form/ErrorMessage";
import { Route } from "type-route";
import { immersionApplicationGateway } from "src/app/config/dependencies";

interface RenewExpiredLinkProps {
  route: Route<typeof routes.renewMagicLink>;
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
    immersionApplicationGateway
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
          Votre demande est enregistrée. Vous recevra une message avec le
          nouveau lien dans quelques instants.{" "}
        </p>
      )}
      {errorMessage && (
        <ErrorMessage title="Désolé : nous n'avons pas été en mesure d'enregistrer vos informations. Veuillez réessayer ultérieurement.">
          {errorMessage}
        </ErrorMessage>
      )}
    </>
  );
};

export const RenewExpiredLinkPage = ({ route }: RenewExpiredLinkProps) => {
  return (
    <RenewExpiredLinkContent
      expiredJwt={route.params.expiredJwt}
      originalURL={route.params.originalURL}
    />
  );
};
