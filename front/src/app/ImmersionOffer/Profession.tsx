import { useField } from "formik";
import React from "react";
import { DropDown } from "src/app/ImmersionOffer/DropDown";
import { immersionOfferGateway } from "src/app/main";
import { DeleteButton } from "src/components/DeleteButton";
import { TextInput } from "src/components/form/TextInput";
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
        justifyContent: "space-between",
        margin: "15px 20px",
      }}
    >
      <DropDown
        title="Rechercher un métier *"
        onSelection={setValue}
        initialTerm={label}
        onTermChange={async (newTerm) => {
          if (!newTerm) return [];
          const romeOptions = await immersionOfferGateway.searchProfession(
            newTerm,
          );

          return romeOptions.map(
            ({ romeCodeMetier, description, matchRanges }) => ({
              value: { romeCodeMetier, label: description },
              description,
              matchRanges,
            }),
          );
        }}
      />
      <TextInput
        label="Code métier"
        name={`${name}.${romeCodeField}`}
        disabled
      />
      <DeleteButton onClick={onDelete} />
    </div>
  );
};
