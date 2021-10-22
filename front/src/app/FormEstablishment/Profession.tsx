import { useField } from "formik";
import React from "react";
import { DropDown } from "src/app/FormEstablishment/DropDown";
import { formEstablishmentGateway } from "src/app/main";
import { DeleteButton } from "src/components/DeleteButton";
import { ProfessionDto } from "src/shared/rome";

type ProfessionProps = {
  name: string;
  label: string;
  onDelete: () => void;
};

const romeCodeField: keyof ProfessionDto = "romeCodeMetier";

export const Profession = ({ name, label, onDelete }: ProfessionProps) => {
  const [__, _, { setValue }] = useField<ProfessionDto>(name);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-evenly",
        margin: "15px 20px",
      }}
    >
      <DropDown
        title="Rechercher un métier *"
        onSelection={setValue}
        initialTerm={label}
        onTermChange={async (newTerm) => {
          if (!newTerm) return [];
          const romeOptions = await formEstablishmentGateway.searchProfession(
            newTerm,
          );

          return romeOptions.map(({ matchRanges, profession }) => ({
            value: profession,
            description: profession.description,
            matchRanges,
          }));
        }}
      />
      <DeleteButton onClick={onDelete} />
    </div>
  );
};
