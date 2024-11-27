import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { ImmersionTextField } from "react-design-system";
import { domElementIds } from "shared";
import { useEstablishmentSiret } from "src/app/hooks/siret.hooks";
import { RenewEstablishmentMagicLinkButton } from "src/app/pages/establishment/RenewEstablishmentMagicLinkButton";

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
            données.
          </p>
          <div className={fr.cx("fr-grid-row", "fr-grid-row--center")}>
            <RenewEstablishmentMagicLinkButton
              id={
                domElementIds.homeEstablishments.siretModal
                  .editEstablishmentButton
              }
              siret={currentSiret}
            />
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
