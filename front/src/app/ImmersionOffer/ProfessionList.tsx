import { useField } from "formik";
import React from "react";
import { Profession } from "src/app/ImmersionOffer/Profession";
import { ProfessionDto } from "src/shared/rome";

type ProfessionListProps = {
  name: string;
  title?: string;
};

export const ProfessionList = ({ name, title }: ProfessionListProps) => {
  const [field, _, { setValue }] = useField<ProfessionDto[]>({ name });
  const professions = field.value;

  const onDelete = (romeCodeMetier: string) => {
    setValue(
      professions.filter(
        (profession) => profession.romeCodeMetier !== romeCodeMetier,
      ),
    );
  };

  return (
    <>
      {title && <h5>{title}</h5>}
      {professions.map(({ romeCodeMetier }, index) => {
        const makeName = (fieldName: keyof ProfessionDto) =>
          `${name}[${index}].${fieldName}`;

        return (
          <Profession
            name={makeName("romeCodeMetier")}
            onDelete={() => onDelete(romeCodeMetier)}
            key={index}
          />
        );
      })}
      <button
        type="button"
        onClick={() => setValue([...field.value, { romeCodeMetier: "" }])}
      >
        Ajouter un métier
      </button>
    </>
  );
};
