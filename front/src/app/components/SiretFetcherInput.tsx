import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import React from "react";
import { ImmersionTextField } from "react-design-system";
import { domElementIds } from "shared";
import { useEstablishmentSiret } from "src/app/hooks/siret.hooks";

type SiretFetcherInputProps = {
  placeholder: string;
  label?: string;
};

export const SiretFetcherInput = ({
  placeholder,
  label,
}: SiretFetcherInputProps) => {
  const {
    currentSiret,
    siretErrorToDisplay,
    isSiretAlreadySaved,
    updateSiret,
    modifyLinkWasSent,
    sendModifyLinkFeedback,
    sendModifyEstablishmentLink,
  } = useEstablishmentSiret();

  const shouldShowInputError = !isSiretAlreadySaved && currentSiret !== "";
  return (
    <>
      <ImmersionTextField
        id={domElementIds.homeEstablishments.siretModal.siretFetcherInput}
        name="siret"
        label={label}
        value={currentSiret}
        placeholder={placeholder}
        error={shouldShowInputError ? siretErrorToDisplay : ""}
        onChange={(e) => updateSiret(e.target.value)}
      />
      {isSiretAlreadySaved && !modifyLinkWasSent && (
        <>
          <p className={fr.cx("fr-valid-text", "fr-mb-2w")}>
            Nous avons bien trouvé votre établissement dans notre base de
            donnée.
          </p>
          <div className={fr.cx("fr-grid-row", "fr-grid-row--center")}>
            <Button
              type="button"
              onClick={() => sendModifyEstablishmentLink(currentSiret)}
              priority="secondary"
              nativeButtonProps={{
                id: domElementIds.homeEstablishments.siretModal
                  .editEstablishmentButton,
              }}
            >
              Recevoir le mail de modification
            </Button>
          </div>
        </>
      )}
      {modifyLinkWasSent && (
        <>
          <span className={fr.cx("fr-valid-text", "fr-text--md", "fr-mb-2w")}>
            Demande envoyée
          </span>
          <p>
            Un e-mail a été envoyé au référent de cet établissement avec un lien
            permettant la mise à jour des informations. Le lien est valable 24h.
          </p>
        </>
      )}
      {sendModifyLinkFeedback.kind === "errored" && (
        <p className={fr.cx("fr-error-text")}>
          {sendModifyLinkFeedback.errorMessage}
        </p>
      )}
      {sendModifyLinkFeedback.kind === "sendModificationLinkErrored" && (
        <p className={fr.cx("fr-error-text")}>
          Une erreur est survenue lors de l'envoi de la demande de modification
          d'entreprise.
        </p>
      )}
    </>
  );
};
