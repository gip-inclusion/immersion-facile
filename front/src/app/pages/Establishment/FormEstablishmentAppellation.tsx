import { useField } from "formik";
import React from "react";
import { AppellationAutocomplete } from "src/app/components/AppellationAutocomplete";
import { DeleteButton } from "src/uiComponents/DeleteButton";
import { AppellationDto } from "src/shared/romeAndAppellationDtos/romeAndAppellation.dto";

type ProfessionProps = {
  name: string;
  label: string;
  onDelete: () => void;
};

export const FormEstablishmentAppellation = ({
  name,
  label,
  onDelete,
}: ProfessionProps) => {
  const [{ value }, _, { setValue }] = useField<AppellationDto>(name);

  return (
    <div
      className={"relative"}
      style={{
        margin: "15px 20px",
      }}
    >
      <AppellationAutocomplete
        title="Rechercher un métier *"
        initialValue={value}
        setFormValue={setValue}
      />
      <DeleteButton onClick={onDelete} classname={"absolute top-1 right-1"} />
    </div>
  );
};
