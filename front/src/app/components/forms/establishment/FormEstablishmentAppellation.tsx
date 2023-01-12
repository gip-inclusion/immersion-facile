import { useField } from "formik";
import React from "react";
import { AppellationDto } from "shared";
import { AppellationAutocomplete } from "src/app/components/forms/autocomplete/AppellationAutocomplete";
import { Button } from "@codegouvfr/react-dsfr/Button";

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
          label="Rechercher un métier *"
          initialValue={value}
          setFormValue={setValue}
          selectedAppellations={selectedAppellations}
        />
      </div>
      <div>
        <Button
          type="button"
          iconId="fr-icon-delete-bin-line"
          title="Suppression"
          onClick={onDelete}
        />
      </div>
    </div>
  );
};
