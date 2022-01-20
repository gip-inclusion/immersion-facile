import { useField } from "formik";
import React, { useEffect, useState } from "react";
import { ProfessionAutocomplete } from "src/app/Profession/ProfessionAutocomplete";
import { TextInput } from "src/components/form/TextInput";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplicationDto";
import { ProfessionDto } from "src/shared/rome";

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

  const [profession, setProfession] = useState<ProfessionDto>({
    romeCodeMetier: "",
    description: "",
  });

  useEffect(() => {
    setValue(profession.description || value);
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
        <ProfessionAutocomplete
          title=""
          initialValue={profession}
          setFormValue={setProfession}
        />
      </div>
    </>
  );
};
