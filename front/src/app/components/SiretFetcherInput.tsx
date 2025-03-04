import { fr } from "@codegouvfr/react-dsfr";
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
      {isSiretAlreadySaved && (
        <p className={fr.cx("fr-valid-text", "fr-mb-2w")}>
          Nous avons bien trouvé votre établissement dans notre base de données.
          Pour modifier votre établissement, connectez-vous à votre tableau de
          bord entreprise.
        </p>
      )}
    </>
  );
};
