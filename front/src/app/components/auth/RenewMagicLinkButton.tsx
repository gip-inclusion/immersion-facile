import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { useState } from "react";
import { domElementIds, type RenewExpiredJwtRequestDto } from "shared";
import { outOfReduxDependencies } from "src/config/dependencies";

export const RenewMagicLinkButton = ({
  renewExpiredJwtRequestDto,
}: {
  renewExpiredJwtRequestDto: RenewExpiredJwtRequestDto;
}): React.JSX.Element => {
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

    if (!renewExpiredJwtRequestDto.expiredJwt) {
      setRequestSuccessful(false);
      setErrorMessage("URL invalide");
      return;
    }

    setRequested(true);
    outOfReduxDependencies.authGateway
      .renewExpiredJwt(renewExpiredJwtRequestDto)
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
      {
        // TODO : en cas d'erreur SUCCES + ERREUR affiché
        // TODO : passer sour redux pour le renouvellement de jwt au lieu de out of redux dep + hooks
        // TODO : avec EmailAuthCode, si j'attends que le JWT expire, alors j'ai visuellement l'erreur Erreur inattendue :
        // Rendered more hooks than during the previous render.
        // + Erreur API 403 : Le jeton d'authentification (JWT) fourni a expiré depuis 1 minutes
        // TODO : avec EmailAuthCode validé, j'ai un token ConnectedUser dans Redux
        // Ce token est utilisé quand il faut faire des actions authentifiés à un moment on fait un GetConnectedUser et je prend une 401 : Le jeton d'authentification (JWT) fourni a expiré
        // Dans ce cas on a des actions Redux de logout qui s'enclanche sans proposer le renouvellement de lien magique
      }
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
