import { FormikErrors, useField } from "formik";
import React from "react";
import { Profession } from "src/app/ImmersionOffer/Profession";
import { ButtonAdd } from "src/components/ButtonAdd";
import { ProfessionDto } from "src/shared/rome";
import { removeAtIndex } from "src/shared/utils";

type ProfessionListProps = {
  name: string;
  title?: string;
};

export const ProfessionList = ({ name, title }: ProfessionListProps) => {
  const [field, { touched, error }, { setValue }] = useField<ProfessionDto[]>({
    name,
  });

  const professions = field.value;
  const onDelete = (index: number) => {
    setValue(removeAtIndex(professions, index));
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div style={{ width: "100%" }}>
        {title && <h5 style={{ marginTop: "25px" }}>{title}</h5>}
        {professions.map(({ description }, index) => (
          <Profession
            name={`${name}[${index}]`}
            label={description}
            onDelete={() => onDelete(index)}
            key={index}
          />
        ))}
      </div>
      <ButtonAdd
        onClick={() =>
          setValue([
            ...field.value,
            { romeCodeMetier: "", description: "" } as ProfessionDto,
          ])
        }
      >
        Ajouter un métier
      </ButtonAdd>

      {touched && error && (
        <div id={name + "-error-description"} className="fr-error-text">
          {typeof error === "string"
            ? error
            : "Veuillez saisir des metiers valides."}
        </div>
      )}
    </div>
  );
};
