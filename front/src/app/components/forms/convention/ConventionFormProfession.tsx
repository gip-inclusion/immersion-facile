import { useField } from "formik";
import React from "react";
import { TextInputError } from "react-design-system";
import { AppellationDto, ConventionDto } from "shared";
import { AppellationAutocomplete } from "src/app/components/forms/autocomplete/AppellationAutocomplete";
import { TextInput } from "src/app/components/forms/commons/TextInput";

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
  const name: keyof ConventionDto = "immersionAppellation";

  const [{ value }, meta, { setValue }] = useField<
    ConventionDto["immersionAppellation"] | undefined
  >(name);

  const error =
    meta.touched && (meta.error as Partial<AppellationDto>)?.appellationLabel;

  if (disabled)
    return (
      <TextInput
        label={label}
        name={name}
        disabled
        value={value?.appellationLabel}
      />
    );

  return (
    <>
      <div className="fr-input-group">
        <label className="fr-label" htmlFor={name}>
          {label}
        </label>
        {description && <span className="fr-hint-text">{description}</span>}
        <AppellationAutocomplete
          title=""
          initialValue={initialFieldValue}
          setFormValue={setValue}
        />
        {error && <TextInputError errorMessage={error} />}
      </div>
    </>
  );
};
