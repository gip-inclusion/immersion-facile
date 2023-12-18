import React from "react";
import { useFormContext } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { FormEstablishmentDto, toDateString } from "shared";
import { booleanSelectOptions } from "src/app/contents/forms/common/values";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import {
  getFormContents,
  makeFieldError,
} from "src/app/hooks/formContents.hooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { Mode, OnStepChange, Step } from "../EstablishmentForm";

export const AvailabilitySection = ({
  mode,
  isSearchable,
  onStepChange,
  currentStep,
  setAvailableForImmersion,
  availableForImmersion,
}: {
  mode: Mode;
  isSearchable: boolean;
  onStepChange: OnStepChange;
  currentStep: Step;
  setAvailableForImmersion: (value: boolean) => void;
  availableForImmersion: boolean | undefined;
}) => {
  const { register, setValue, getValues, formState, clearErrors } =
    useFormContext<FormEstablishmentDto>();
  const formContents = getFormContents(
    formEstablishmentFieldsLabels,
  ).getFormFields();
  const getFieldError = makeFieldError(formState);
  const { enableMaxContactPerWeek } = useFeatureFlags();

  const shouldShowErrorOnAvailableForImmersion =
    availableForImmersion === undefined &&
    (getFieldError("maxContactsPerWeek") ||
      getFieldError("nextAvailabilityDate"));

  const currentNextAvailabilityDate = getValues("nextAvailabilityDate");

  const currentValueFormated =
    currentNextAvailabilityDate &&
    toDateString(new Date(currentNextAvailabilityDate));

  return (
    <section className={fr.cx("fr-mb-4w")}>
      <RadioButtons
        name="availableForImmersion"
        options={booleanSelectOptions.map((option) => ({
          ...option,
          nativeInputProps: {
            ...option.nativeInputProps,
            checked:
              Boolean(option.nativeInputProps.value) === availableForImmersion,
            onChange: () => {
              const isAvailable = option.nativeInputProps.value === 1;
              clearErrors("nextAvailabilityDate");
              clearErrors("maxContactsPerWeek");

              setAvailableForImmersion(isAvailable);
              if (isAvailable) {
                setValue("nextAvailabilityDate", undefined);
              }
            },
          },
        }))}
        orientation="horizontal"
        state={shouldShowErrorOnAvailableForImmersion ? "error" : "default"}
        stateRelatedMessage={
          shouldShowErrorOnAvailableForImmersion
            ? "Veuillez remplir ce champ"
            : null
        }
      />

      {availableForImmersion === false && (
        <Input
          {...formContents["nextAvailabilityDate"]}
          nativeInputProps={{
            ...register("nextAvailabilityDate"),
            value: currentValueFormated,
            onChange: (event) => {
              setValue(
                "nextAvailabilityDate",
                new Date(event.currentTarget.value).toISOString(),
                {
                  shouldValidate: true,
                },
              );
            },
            onBlur: () => {},
            type: "date",
            min: toDateString(new Date()),
          }}
          {...getFieldError("nextAvailabilityDate")}
        />
      )}
      {enableMaxContactPerWeek.isActive &&
        availableForImmersion !== undefined && (
          <Input
            label={
              availableForImmersion
                ? formContents.maxContactsPerWeek.label
                : formContents.maxContactPerWeekWhenAvailable.label
            }
            nativeInputProps={{
              ...formContents.maxContactsPerWeek,
              ...register("maxContactsPerWeek", {
                valueAsNumber: true,
              }),
              type: "number",
              min:
                mode === "create" || (mode === "edit" && isSearchable) ? 1 : 0,
              pattern: "\\d*",
            }}
            disabled={mode === "edit" && !isSearchable}
            {...getFieldError("maxContactsPerWeek")}
          />
        )}
      {currentStep !== null && (
        <ButtonsGroup
          inlineLayoutWhen="always"
          alignment="left"
          buttonsEquisized
          buttons={[
            {
              children: "Étape précédente",
              iconId: "fr-icon-arrow-left-line",
              priority: "secondary",
              disabled: true,
            },
            {
              children: "Étape suivante",
              disabled: availableForImmersion === undefined,
              onClick: () =>
                onStepChange(2, ["maxContactsPerWeek", "nextAvailabilityDate"]),
              type: "button",
              iconId: "fr-icon-arrow-right-line",
              iconPosition: "right",
            },
          ]}
        />
      )}
    </section>
  );
};
