import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import React from "react";
import { useFormContext } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { ConventionDto } from "shared";
import { booleanSelectOptions } from "src/app/contents/forms/common/values";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useTutorIsEstablishmentRepresentative } from "src/app/hooks/convention.hooks";
import { getFormContents } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { EstablishementTutorFields } from "./EstablishementTutorFields";
import { EstablishmentBusinessFields } from "./EstablishmentBusinessFields";
import { EstablishmentRepresentativeFields } from "./EstablishmentRepresentativeFields";

export const EstablishmentFormSection = (): JSX.Element => {
  useTutorIsEstablishmentRepresentative();

  const dispatch = useDispatch();
  const isTutorEstablishmentRepresentative = useAppSelector(
    conventionSelectors.isTutorEstablishmentRepresentative,
  );
  const { getValues } = useFormContext<ConventionDto>();
  const t = useConventionTexts(getValues().internshipKind);

  const { getFormFields } = getFormContents(
    formConventionFieldsLabels(getValues("internshipKind")),
  );
  const formContents = getFormFields();

  const isFetchingSiret = useSelector(siretSelectors.isFetching);

  return (
    <>
      <Alert
        severity="info"
        small
        className={fr.cx("fr-my-2w")}
        description={t.establishmentSection.subtitle}
      />

      <EstablishmentBusinessFields />
      <RadioButtons
        legend={
          formContents.isEstablishmentTutorIsEstablishmentRepresentative.label
        }
        hintText={
          formContents.isEstablishmentTutorIsEstablishmentRepresentative
            .hintText
        }
        options={booleanSelectOptions.map((option) => ({
          ...option,
          nativeInputProps: {
            checked:
              Boolean(option.nativeInputProps.value) ===
              isTutorEstablishmentRepresentative,
            onChange: () => {
              dispatch(
                conventionSlice.actions.isTutorEstablishmentRepresentativeChanged(
                  option.nativeInputProps.value === 1,
                ),
              );
            },
          },
        }))}
        disabled={isFetchingSiret}
      />
      <EstablishementTutorFields />
      {!isTutorEstablishmentRepresentative && (
        <EstablishmentRepresentativeFields />
      )}
    </>
  );
};
