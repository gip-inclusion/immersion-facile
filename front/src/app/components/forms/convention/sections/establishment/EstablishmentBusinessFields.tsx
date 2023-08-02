import React, { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { ConventionDto } from "shared";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import {
  useSiretFetcher,
  useSiretRelatedField,
} from "src/app/hooks/siret.hooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";

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
  const convention = useAppSelector(conventionSelectors.convention);

  const { getValues, register, control } = useFormContext<ConventionDto>();
  const values = getValues();

  // ADDED PREVIOUS FORM BEHAVIOR FOR FIXING BAD FORM UPDATE
  const currentSiretOnSiretField = useWatch({
    control,
    name: "siret",
  });
  useEffect(() => {
    updateSiret(currentSiretOnSiretField);
  }, [currentSiretOnSiretField]);
  // ====================

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
          // NOT WORKING SINCE PREVIOUS UPDATE
          // PROBABLY MISSING SET FROM VALUE ON CHANGE
          // onChange: (event) => {
          //   updateSiret(event.target.value);
          // },
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
          value:
            establishmentInfos?.businessName || convention?.businessName || "",
        }}
        disabled={enableInseeApi.isActive}
      />
    </>
  );
};
