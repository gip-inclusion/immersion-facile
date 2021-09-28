import { useField } from "formik";
import React from "react";
import { Profession } from "src/app/ImmersionOffer/Profession";
import { ButtonAdd } from "src/components/ButtonAdd";
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
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div style={{ width: "100%" }}>
        {title && <h5 style={{ marginTop: "25px" }}>{title}</h5>}
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
      </div>
      <ButtonAdd
        onClick={() => setValue([...field.value, { romeCodeMetier: "" }])}
      >
        Ajouter un métier
      </ButtonAdd>
    </div>
  );
};
