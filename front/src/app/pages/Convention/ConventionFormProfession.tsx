import { useField } from "formik";
import React from "react";
import { AppellationAutocomplete } from "src/app/components/AppellationAutocomplete";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { AppellationDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import { TextInput } from "src/uiComponents/form/TextInput";

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

  const [{ value }, _, { setValue }] = useField<
    ConventionDto["immersionAppellation"] | undefined
  >(name);

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
        {description && (
          <span className="fr-hint-text" id="select-hint-desc-hint">
            {description}
          </span>
        )}
        <AppellationAutocomplete
          title=""
          initialValue={initialFieldValue}
          setFormValue={setValue}
        />
      </div>
    </>
  );
};
