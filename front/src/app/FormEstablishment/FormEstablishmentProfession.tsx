import { useField } from "formik";
import React from "react";
import { ProfessionAutocomplete } from "src/app/Profession/ProfessionAutocomplete";
import { DeleteButton } from "src/components/DeleteButton";
import { ProfessionDto } from "src/shared/rome";

type ProfessionProps = {
  name: string;
  label: string;
  onDelete: () => void;
};

export const FormEstablishmentProfession = ({
  name,
  label,
  onDelete,
}: ProfessionProps) => {
  const [{ value }, _, { setValue }] = useField<ProfessionDto>(name);

  return (
    <div
      className={"relative"}
      style={{
        margin: "15px 20px",
      }}
    >
      <ProfessionAutocomplete
        title="Rechercher un métier *"
        initialValue={value}
        setFormValue={setValue}
      />
      <DeleteButton onClick={onDelete} classname={"absolute top-1 right-1"} />
    </div>
  );
};
