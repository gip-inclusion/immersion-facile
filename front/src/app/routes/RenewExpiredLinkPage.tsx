import React, { useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Route } from "type-route";
import { ConventionMagicLinkPayload, domElementIds } from "shared";
import { decodeMagicLinkJwtWithoutSignatureCheck } from "shared";
import { LinkHome, MainWrapper } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { conventionGateway } from "src/config/dependencies";

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
  const jwtPayload =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionMagicLinkPayload>(
      expiredJwt,
    );
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

  if (!jwtPayload.applicationId)
    return (
      <>
        <div>
          Votre lien est périmé, veuillez renouveler votre demande si vous
          souhaitez éditer votre établissement.
        </div>
        <LinkHome {...routes.home().link}>Page d'accueil</LinkHome>
      </>
    );

  return (
    <>
      <div style={{ whiteSpace: "pre-line" }}>
        Votre lien a périmé. Voulez-vous recevoir un nouveau lien ?{" "}
      </div>
      {!requestSuccessful && (
        <Button
          className={fr.cx("fr-mt-2w")}
          disabled={requested}
          onClick={onClick}
          nativeButtonProps={{
            id: domElementIds.magicLinkRenewal.magicLinkRenewalButton,
          }}
        >
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
        <Alert
          severity="error"
          title="Désolé : nous n'avons pas été en mesure d'enregistrer vos informations. Veuillez réessayer ultérieurement."
          description={errorMessage}
        />
      )}
    </>
  );
};

export const RenewExpiredLinkPage = ({ route }: RenewExpiredLinkProps) => (
  <HeaderFooterLayout>
    <MainWrapper layout="boxed">
      <RenewExpiredLinkContent
        expiredJwt={route.params.expiredJwt}
        originalURL={route.params.originalURL}
      />
    </MainWrapper>
  </HeaderFooterLayout>
);
