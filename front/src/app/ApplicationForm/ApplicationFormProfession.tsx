import { useField } from "formik";
import React, { useEffect, useState } from "react";
import { ProfessionAutocomplete } from "src/app/Profession/ProfessionAutocomplete";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplicationDto";
import { ProfessionDto } from "src/shared/rome";

type ApplicationFormProfessionProps = {
  label: string;
  description?: string;
};

export const ApplicationFormProfession = ({
  label,
  description,
}: ApplicationFormProfessionProps) => {
  const name: keyof ImmersionApplicationDto = "immersionProfession";
  const [__, _, { setValue }] =
    useField<ImmersionApplicationDto["immersionProfession"]>(name);

  const [profession, setProfession] = useState<ProfessionDto>({
    romeCodeMetier: "",
    description: "",
  });

  useEffect(() => {
    setValue(profession.description);
  }, [profession]);

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
