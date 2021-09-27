import { useField } from "formik";
import React from "react";
import { DropDown } from "src/app/ImmersionOffer/DropDown";
import { TextInput } from "src/components/form/TextInput";
import { ProfessionDto } from "src/shared/rome";

type ProfessionProps = {
  name: string;
  onDelete: () => void;
};

export const Profession = ({ name, onDelete }: ProfessionProps) => {
  const [_, __, { setValue }] = useField<string>(name);

  return (
    <div style={{ display: "flex" }}>
      <DropDown title="Rechercher un métier " onSelection={setValue} />
      <TextInput label="Code métier" name={name} disabled />
      <button onClick={onDelete}>Supprimer ce métier</button>
    </div>
  );
};
