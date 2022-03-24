import { useField } from "formik";
import React, { useEffect, useState } from "react";
import { AppellationAutocomplete } from "src/app/Profession/AppellationAutocomplete";
import { TextInput } from "src/components/form/TextInput";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplication/ImmersionApplication.dto";
import { AppellationCode } from "src/shared/rome";
import { AppellationDto } from "src/shared/romeAndAppellationDtos/romeAndAppellation.dto";

type ApplicationFormProfessionProps = {
  label: string;
  description?: string;
  disabled?: boolean;
};

export const ApplicationFormProfession = ({
  label,
  description,
  disabled,
}: ApplicationFormProfessionProps) => {
  const name: keyof ImmersionApplicationDto = "immersionProfession";
  const [{ value }, _, { setValue }] =
    useField<ImmersionApplicationDto["immersionProfession"]>(name);

  const [profession, setProfession] = useState<AppellationDto>({
    romeCode: "",
    appellationCode: "",
    romeLabel: "",
    appellationLabel: "",
  });

  useEffect(() => {
    setValue(profession.appellationLabel || value);
  }, [profession]);

  if (disabled) return <TextInput label={label} name={name} disabled />;

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
          initialValue={profession}
          setFormValue={setProfession}
        />
      </div>
    </>
  );
};
