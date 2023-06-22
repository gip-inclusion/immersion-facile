import React from "react";
import { useFormContext } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import {
  AppellationAndRomeDto,
  ConventionReadDto,
  domElementIds,
} from "shared";
import { TextInputError } from "react-design-system";
import { AppellationAutocomplete } from "src/app/components/forms/autocomplete/AppellationAutocomplete";

type ConventionFormProfessionProps = {
  label: string;
  description?: string;
  disabled?: boolean;
  initialFieldValue: AppellationAndRomeDto;
};

export const ConventionFormProfession = ({
  label,
  description,
  disabled,
  initialFieldValue,
}: ConventionFormProfessionProps) => {
  const {
    setValue,
    formState: { errors, touchedFields },
    getValues,
  } = useFormContext<ConventionReadDto>();

  const error =
    touchedFields.immersionAppellation &&
    (errors.immersionAppellation as Partial<AppellationAndRomeDto>)
      ?.appellationLabel;

  if (disabled)
    return (
      <Input
        label={label}
        nativeInputProps={{
          name: "immersionAppellation",
          value: getValues().immersionAppellation?.appellationLabel,
        }}
        disabled
      />
    );

  return (
    <>
      <div className={fr.cx("fr-input-group")}>
        <AppellationAutocomplete
          label={label}
          initialValue={initialFieldValue}
          id={
            domElementIds.conventionImmersionRoute.conventionSection
              .immersionAppellation
          }
          onAppellationSelected={(appellation) => {
            setValue("immersionAppellation.romeCode", appellation.romeCode);
            setValue("immersionAppellation.romeLabel", appellation.romeLabel);
            setValue(
              "immersionAppellation.appellationCode",
              appellation.appellationCode,
            );
            setValue(
              "immersionAppellation.appellationLabel",
              appellation.appellationLabel,
            );
          }}
          selectedAppellations={[
            {
              romeLabel: getValues().immersionAppellation?.romeLabel ?? "",
              romeCode: getValues().immersionAppellation?.romeCode ?? "",
              appellationCode:
                getValues().immersionAppellation?.appellationCode ?? "",
              appellationLabel:
                getValues().immersionAppellation?.appellationLabel ?? "",
            },
          ]}
          description={description}
          onInputClear={() => {
            setValue("immersionAppellation.romeCode", "");
            setValue("immersionAppellation.romeLabel", "");
            setValue("immersionAppellation.appellationCode", "");
            setValue("immersionAppellation.appellationLabel", "");
          }}
        />
        {error && <TextInputError errorMessage={error} />}
      </div>
    </>
  );
};
