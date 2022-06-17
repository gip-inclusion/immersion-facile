import { useField } from "formik";
import React from "react";
import { ConventionStatus } from "shared/src/convention/convention.dto";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { useSiretFetcher, useSiretRelatedField } from "src/hooks/siret.hooks";
import {
  TextInput,
  TextInputControlled,
} from "src/uiComponents/form/TextInput";

export const EstablishmentCommonFields = ({
  disabled,
}: {
  disabled: undefined | boolean;
}) => {
  const { enableInseeApi } = useFeatureFlags();
  const { updateSiret, currentSiret, siretErrorToDisplay, isFetchingSiret } =
    useSiretFetcher({
      shouldFetchEvenIfAlreadySaved: true,
    });
  const [field] = useField<ConventionStatus>("status");
  const isSiretFetcherDisabled = field.value !== "DRAFT";
  useSiretRelatedField("businessName", {
    disabled: isSiretFetcherDisabled,
  });

  return (
    <>
      <TextInputControlled
        value={currentSiret}
        setValue={updateSiret}
        error={siretErrorToDisplay}
        label="Indiquez le SIRET de la structure d'accueil *"
        name="siret"
        placeholder="362 521 879 00034"
        description="la structure d'accueil, c'est l'entreprise, le commerce, l'association ... où vous allez faire votre immersion"
        disabled={disabled}
      />
      <TextInput
        label="Indiquez le nom (raison sociale) de l'établissement d'accueil *"
        name="businessName"
        type="text"
        placeholder=""
        description=""
        disabled={enableInseeApi}
      />
      <TextInput
        label="Indiquez le prénom, nom et fonction du tuteur *"
        name="mentor"
        type="text"
        placeholder=""
        description="Ex : Alain Prost, pilote automobile"
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        label="Indiquez le numéro de téléphone du tuteur ou de la structure d'accueil *"
        name="mentorPhone"
        type="tel"
        placeholder="0606060707"
        description="pour que l'on puisse le contacter à propos de l’immersion"
        disabled={disabled}
      />
      <TextInput
        label="Indiquez l'e-mail du tuteur *"
        name="mentorEmail"
        type="email"
        placeholder="nom@exemple.com"
        description="pour envoyer la validation de la convention"
        disabled={disabled}
        className="!mb-1"
      />
    </>
  );
};
