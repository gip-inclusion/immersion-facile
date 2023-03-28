import { Input } from "@codegouvfr/react-dsfr/Input";
import React from "react";
import { useFormContext } from "react-hook-form";
import { ConventionDto } from "shared";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import {
  useSiretFetcher,
  useSiretRelatedField,
} from "src/app/hooks/siret.hooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";

export const EstablishmentBusinessFields = ({
  disabled,
}: {
  disabled: undefined | boolean;
}): JSX.Element => {
  const { enableInseeApi } = useFeatureFlags();
  const { currentSiret, updateSiret, siretErrorToDisplay, establishmentInfos } =
    useSiretFetcher({
      shouldFetchEvenIfAlreadySaved: true,
    });

  const { getValues, register, setValue } = useFormContext<ConventionDto>();
  const values = getValues();
  const conventionStatus = values.status;
  useSiretRelatedField("businessName", {
    disabled: conventionStatus !== "DRAFT",
  });
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();
  return (
    <>
      <Input
        {...formContents.siret}
        nativeInputProps={{
          ...formContents.siret,
          ...register("siret"),
          value: currentSiret || values?.siret,
          onChange: (event) => {
            setValue("siret", event.currentTarget.value);
            updateSiret(event.currentTarget.value);
          },
        }}
        disabled={disabled}
        state={siretErrorToDisplay ? "error" : undefined}
        stateRelatedMessage={siretErrorToDisplay}
      />
      <Input
        {...formContents.businessName}
        nativeInputProps={{
          ...formContents.businessName,
          ...register("businessName"),
          value: establishmentInfos ? establishmentInfos.businessName : "",
        }}
        disabled={enableInseeApi}
      />
    </>
  );
};
