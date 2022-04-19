import { useField } from "formik";
import React from "react";
import { AppellationDto } from "src/shared/romeAndAppellationDtos/romeAndAppellation.dto";
import { removeAtIndex } from "src/shared/utils";
import { ButtonAdd } from "src/uiComponents/ButtonAdd";
import { FormEstablishmentAppellation } from "./FormEstablishmentAppellation";

type AppellationListProps = {
  name: string;
  title?: string;
};

export const AppellationList = ({ name, title }: AppellationListProps) => {
  const [field, { touched, error }, { setValue }] = useField<AppellationDto[]>({
    name,
  });

  const professions = field.value;
  const onDelete = (index: number) => {
    setValue(removeAtIndex(professions, index));
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div className="w-full">
        {title && <h5 className="text-lg font-semibold mt-6">{title}</h5>}
        {professions.map((_, index) => (
          <FormEstablishmentAppellation
            name={`${name}[${index}]`}
            onDelete={() => onDelete(index)}
            key={index}
          />
        ))}
      </div>
      <ButtonAdd
        className="my-4"
        onClick={() =>
          setValue([
            ...field.value,
            {
              romeCode: "",
              appellationCode: "",
              romeLabel: "",
              appellationLabel: "",
            },
          ])
        }
      >
        Ajouter un métier
      </ButtonAdd>

      {touched && error && (
        <div id={name + "-error-description"} className="fr-error-text">
          {typeof error === "string" ? error : "Indiquez au moins 1 métier."}
        </div>
      )}
    </div>
  );
};
