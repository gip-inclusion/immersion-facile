import { useField } from "formik";
import React from "react";
import { AppellationAutocomplete } from "src/app/components/AppellationAutocomplete";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplication/ImmersionApplication.dto";
import { AppellationDto } from "src/shared/romeAndAppellationDtos/romeAndAppellation.dto";
import { TextInput } from "src/uiComponents/form/TextInput";

type ApplicationFormProfessionProps = {
  label: string;
  description?: string;
  disabled?: boolean;
  initialFieldValue: AppellationDto;
};

export const ApplicationFormProfession = ({
  label,
  description,
  disabled,
  initialFieldValue,
}: ApplicationFormProfessionProps) => {
  const name: keyof ImmersionApplicationDto = "immersionAppellation";

  const [{ value }, _, { setValue }] =
    useField<ImmersionApplicationDto["immersionAppellation"]>(name);

  if (disabled)
    return (
      <TextInput
        label={label}
        name={name}
        disabled
        value={value.appellationLabel}
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
