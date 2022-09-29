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
  const t = useConventionTextsFromFormikContext();
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
        label={`${t.establishment.siret.label} *`}
        name="siret"
        placeholder={t.establishment.siret.placeholder}
        description={t.establishment.siret.description}
        disabled={disabled}
      />
      <TextInput
        label={`${t.establishment.businessNameLabel} *`}
        name={getConventionFieldName("businessName")}
        type="text"
        placeholder=""
        description=""
        disabled={enableInseeApi}
      />
      <TextInput
        label={`${t.establishment.firstName.label} *`}
        name={getConventionFieldName("signatories.mentor.firstName")}
        type="text"
        placeholder=""
        description={t.establishment.firstName.description}
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        label={`${t.establishment.lastName.label} *`}
        name={getConventionFieldName("signatories.mentor.lastName")}
        type="text"
        placeholder=""
        description={t.establishment.lastName.description}
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        label={`${t.establishment.job.label} *`}
        name={getConventionFieldName("signatories.mentor.job")}
        type="text"
        placeholder=""
        description={t.establishment.job.description}
        disabled={disabled || isFetchingSiret}
      />
      <TextInput
        label={`${t.establishment.phone.label} *`}
        name={getConventionFieldName("signatories.mentor.phone")}
        type="tel"
        placeholder={t.establishment.phone.placeholder}
        description={t.establishment.phone.description}
        disabled={disabled}
      />
      <TextInput
        label={`${t.establishment.email.label} *`}
        name={getConventionFieldName("signatories.mentor.email")}
        type="email"
        placeholder={t.establishment.email.placeholder}
        description={t.establishment.email.description}
        disabled={disabled}
        className="!mb-1"
      />
    </>
  );
};
