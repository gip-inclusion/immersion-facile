import React from "react";
import { useField, useFormikContext } from "formik";
import { ConventionDto, ConventionStatus } from "shared";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import {
  useSiretFetcher,
  useSiretRelatedField,
} from "src/app/hooks/siret.hooks";
import {
  TextInputControlled,
  TextInput,
} from "src/app/components/forms/commons/TextInput";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";

export const EstablishmentBusinessFields = ({
  disabled,
}: {
  disabled: undefined | boolean;
}): JSX.Element => {
  const { enableInseeApi } = useFeatureFlags();
  const { updateSiret, currentSiret, siretErrorToDisplay } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: true,
  });
  const [conventionStatus] = useField<ConventionStatus>("status");
  useSiretRelatedField("businessName", {
    disabled: conventionStatus.value !== "DRAFT",
  });
  const { values } = useFormikContext<ConventionDto>();
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();
  return (
    <>
      <TextInputControlled
        {...formContents.siret}
        value={currentSiret}
        setValue={updateSiret}
        error={siretErrorToDisplay}
        disabled={disabled}
      />
      <TextInput
        {...formContents.businessName}
        type="text"
        disabled={enableInseeApi}
      />
    </>
  );
};
