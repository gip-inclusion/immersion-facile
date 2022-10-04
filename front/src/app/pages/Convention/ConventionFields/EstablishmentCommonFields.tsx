import { useField } from "formik";
import React from "react";
import { ConventionStatus, getConventionFieldName } from "shared";
import { useConventionTextsFromFormikContext } from "src/app/pages/Convention/texts/textSetup";
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
  const conventionTextFields = useConventionTextsFromFormikContext();
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
        label={`${conventionTextFields.establishment.siret.label} *`}
        name="siret"
        placeholder={conventionTextFields.establishment.siret.placeholder}
        description={conventionTextFields.establishment.siret.description}
        disabled={disabled}
      />
      <TextInput
        label={`${conventionTextFields.establishment.businessNameLabel} *`}
        name={getConventionFieldName("businessName")}
        type="text"
        placeholder=""
        description=""
        disabled={enableInseeApi}
      />
      <TextInput
        label={`${conventionTextFields.establishment.firstName.label} *`}
        name={getConventionFieldName("mentor.firstName")}
        type="text"
        placeholder=""
        description={conventionTextFields.establishment.firstName.description}
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        label={`${conventionTextFields.establishment.lastName.label} *`}
        name={getConventionFieldName("mentor.lastName")}
        type="text"
        placeholder=""
        description={conventionTextFields.establishment.lastName.description}
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        label={`${conventionTextFields.establishment.job.label} *`}
        name={getConventionFieldName("mentor.job")}
        type="text"
        placeholder=""
        description={conventionTextFields.establishment.job.description}
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        label={`${conventionTextFields.establishment.phone.label} *`}
        name={getConventionFieldName("mentor.phone")}
        type="tel"
        placeholder={conventionTextFields.establishment.phone.placeholder}
        description={conventionTextFields.establishment.phone.description}
        disabled={disabled}
      />
      <TextInput
        label={`${conventionTextFields.establishment.email.label} *`}
        name={getConventionFieldName("mentor.email")}
        type="email"
        placeholder={conventionTextFields.establishment.email.placeholder}
        description={conventionTextFields.establishment.email.description}
        disabled={disabled}
        className="!mb-1"
      />
    </>
  );
};
