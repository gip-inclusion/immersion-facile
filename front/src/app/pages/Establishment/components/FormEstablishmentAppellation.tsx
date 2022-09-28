import { useField } from "formik";
import React from "react";
import { AppellationAutocomplete } from "src/app/components/AppellationAutocomplete";
import { AppellationDto } from "shared";
import { ButtonDelete } from "react-design-system/immersionFacile";

type ProfessionProps = {
  name: string;
  onDelete: () => void;
  selectedAppellations: AppellationDto[];
};

export const FormEstablishmentAppellation = ({
  name,
  onDelete,
  selectedAppellations,
}: ProfessionProps) => {
  const [{ value }, _, { setValue }] = useField<AppellationDto>(name);

  return (
    <div className="flex items-end">
      <div className="flex-1">
        <AppellationAutocomplete
          title="Rechercher un métier *"
          initialValue={value}
          setFormValue={setValue}
          selectedAppellations={selectedAppellations}
        />
      </div>
      <div>
        <ButtonDelete onClick={onDelete} />
      </div>
    </div>
  );
};
