import { useField } from "formik";
import React from "react";
import { DropDown } from "src/app/ImmersionOffer/DropDown";
import { immersionOfferGateway } from "src/app/main";
import { DeleteButton } from "src/components/DeleteButton";
import { TextInput } from "src/components/form/TextInput";

type ProfessionProps = {
  name: string;
  onDelete: () => void;
};

export const Profession = ({ name, onDelete }: ProfessionProps) => {
  const [_, __, { setValue }] = useField<string>(name);

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
        onTermChange={async (newTerm) => {
          if (!newTerm) return [];
          const romeOptions = await immersionOfferGateway.searchProfession(
            newTerm,
          );

          return romeOptions.map(
            ({ romeCodeMetier, description, matchRanges }) => ({
              value: romeCodeMetier,
              description,
              matchRanges,
            }),
          );
        }}
      />
      <TextInput label="Code métier" name={name} disabled />
      <DeleteButton onClick={onDelete} />
    </div>
  );
};
