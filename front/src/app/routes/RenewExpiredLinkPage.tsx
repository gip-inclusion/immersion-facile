import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import React, { useState } from "react";
import { MainWrapper } from "react-design-system";
import { ConventionJwtPayload, domElementIds } from "shared";
import { decodeMagicLinkJwtWithoutSignatureCheck } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { outOfReduxDependencies } from "src/config/dependencies";
import { Route } from "type-route";

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
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(expiredJwt);
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
    outOfReduxDependencies.conventionGateway
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
        <p>
          Votre lien est périmé. Pour le renouveler et éditer votre entreprise :
        </p>
        <ol>
          <li>Retournez sur l'accueil entreprises</li>
          <li>Cliquez sur "Modifier mon entreprise" et entrez votre SIRET</li>
          <li>
            Un nouveau lien vous sera envoyé par mail pour modifier votre
            entreprise
          </li>
        </ol>
        <Button
          {...routes.homeEstablishments().link}
          className={fr.cx("fr-mt-2w")}
        >
          Retourner sur l'accueil entreprises
        </Button>
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
            id: domElementIds.magicLinkRenewal.renewalButton,
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
