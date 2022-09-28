import { useField } from "formik";
import React from "react";
import { AppellationDto } from "shared";
import { removeAtIndex } from "shared";
import { ButtonAdd } from "react-design-system/immersionFacile";
import { FormEstablishmentAppellation } from "./FormEstablishmentAppellation";

type AppellationListProps = {
  name: string;
  title?: string;
};

export const AppellationList = ({ name, title }: AppellationListProps) => {
  const [field, { touched, error }, { setValue }] = useField<AppellationDto[]>({
    name,
  });

  const appellations = field.value;

  const onDelete = (index: number) => {
    setValue(removeAtIndex(appellations, index));
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full">
        {title && <h5 className="text-lg font-semibold">{title}</h5>}
        <div className="flex flex-col gap-5">
          {appellations.map(({ appellationCode }, index) => (
            <FormEstablishmentAppellation
              name={`${name}[${index}]`}
              onDelete={() => onDelete(index)}
              key={`${appellationCode}-${index}`}
              selectedAppellations={appellations}
            />
          ))}
        </div>
      </div>
      <ButtonAdd
        className="fr-my-4v"
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
