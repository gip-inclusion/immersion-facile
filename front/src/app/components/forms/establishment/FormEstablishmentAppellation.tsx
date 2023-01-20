import { useField } from "formik";
import React from "react";
import { AppellationDto } from "shared";
import { AppellationAutocomplete } from "src/app/components/forms/autocomplete/AppellationAutocomplete";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr";

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
    <div className={fr.cx("fr-grid-row", "fr-grid-row--bottom")}>
      <div className={fr.cx("fr-col")}>
        <AppellationAutocomplete
          label="Rechercher un métier *"
          initialValue={value}
          setFormValue={setValue}
          selectedAppellations={selectedAppellations}
        />
      </div>
      <Button
        type="button"
        iconId="fr-icon-delete-bin-line"
        title="Suppression"
        onClick={onDelete}
      />
    </div>
  );
};
