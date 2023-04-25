import React, { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
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

  const { getValues, register, control } = useFormContext<ConventionDto>();
  const values = getValues();
  const siret = useWatch({
    control,
    name: "siret",
  });
  useEffect(() => {
    updateSiret(siret);
  }, [siret]);

  useSiretRelatedField("businessName", {
    disabled: values.status !== "DRAFT",
  });
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();
  return (
    <>
      <Input
        label={formContents.siret.label}
        hintText={formContents.siret.hintText}
        nativeInputProps={{
          ...formContents.siret,
          ...register("siret"),
          value: currentSiret || values.siret,
        }}
        disabled={disabled}
        state={siretErrorToDisplay ? "error" : undefined}
        stateRelatedMessage={siretErrorToDisplay}
      />
      <Input
        label={formContents.businessName.label}
        hintText={formContents.businessName.hintText}
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
