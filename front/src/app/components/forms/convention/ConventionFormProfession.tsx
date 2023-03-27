import React from "react";
import { useFormContext } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { TextInputError } from "react-design-system";
import { AppellationDto, ConventionReadDto } from "shared";
import { AppellationAutocomplete } from "src/app/components/forms/autocomplete/AppellationAutocomplete";
import { emptyAppellation } from "../establishment/MultipleAppellationInput";

type ConventionFormProfessionProps = {
  label: string;
  description?: string;
  disabled?: boolean;
  initialFieldValue: AppellationDto;
};

export const ConventionFormProfession = ({
  label,
  description,
  disabled,
  initialFieldValue,
}: ConventionFormProfessionProps) => {
  const name: keyof ConventionReadDto = "immersionAppellation";
  const {
    setValue,
    formState: { errors, touchedFields },
    getValues,
  } = useFormContext<ConventionReadDto>();

  const error =
    touchedFields[name] &&
    (errors[name] as Partial<AppellationDto>)?.appellationLabel;

  if (disabled)
    return (
      <Input
        label={label}
        nativeInputProps={{
          name,
          value: getValues()[name]?.appellationLabel,
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
          onAppellationSelected={setValue}
          description={description}
          onInputClear={() => {
            setValue(name, emptyAppellation);
          }}
        />
        {error && <TextInputError errorMessage={error} />}
      </div>
    </>
  );
};
