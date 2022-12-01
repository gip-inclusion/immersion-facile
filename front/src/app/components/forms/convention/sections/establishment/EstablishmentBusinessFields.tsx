import React from "react";
import { useField } from "formik";
import { ConventionStatus, getConventionFieldName } from "shared";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { useSiretFetcher, useSiretRelatedField } from "src/hooks/siret.hooks";
import { useConventionTextsFromFormikContext } from "src/app/contents/convention/textSetup";
import {
  TextInputControlled,
  TextInput,
} from "src/app/components/forms/commons/TextInput";

export const EstablishmentBusinessFields = ({
  disabled,
}: {
  disabled: undefined | boolean;
}): JSX.Element => {
  const t = useConventionTextsFromFormikContext();
  const { enableInseeApi } = useFeatureFlags();
  const { updateSiret, currentSiret, siretErrorToDisplay } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: true,
  });
  const [conventionStatus] = useField<ConventionStatus>("status");
  useSiretRelatedField("businessName", {
    disabled: conventionStatus.value !== "DRAFT",
  });
  return (
    <>
      <TextInputControlled
        value={currentSiret}
        setValue={updateSiret}
        error={siretErrorToDisplay}
        label={`${t.establishmentSection.siret.label} *`}
        name="siret"
        placeholder={t.establishmentSection.siret.placeholder}
        description={t.establishmentSection.siret.description}
        disabled={disabled}
      />
      <TextInput
        label={`${t.establishmentSection.businessNameLabel} *`}
        name={getConventionFieldName("businessName")}
        type="text"
        placeholder=""
        description=""
        disabled={enableInseeApi}
      />
    </>
  );
};
