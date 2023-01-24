import { useField } from "formik";
import React from "react";
import { ButtonAdd } from "react-design-system";
import { AppellationDto, removeAtIndex } from "shared";
import { FormEstablishmentAppellation } from "./FormEstablishmentAppellation";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";

type AppellationListProps = {
  name: string;
  title?: string;
};

export const AppellationList = ({ name, title }: AppellationListProps) => {
  const { cx } = useStyles();
  const [field, { touched, error }, { setValue }] = useField<AppellationDto[]>({
    name,
  });

  const appellations = field.value;

  const onDelete = (index: number) => {
    setValue(removeAtIndex(appellations, index));
  };

  return (
    <div className={cx(fr.cx("fr-input-group"), "im-appellation-autocomplete")}>
      <>
        {title && <h2 className={fr.cx("fr-text--lead")}>{title}</h2>}
        {appellations.map(({ appellationCode }, index) => (
          <FormEstablishmentAppellation
            name={`${name}[${index}]`}
            onDelete={() => onDelete(index)}
            key={`${appellationCode}-${index}`}
            selectedAppellations={appellations}
          />
        ))}
      </>
      <ButtonAdd
        className={fr.cx("fr-my-4v")}
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
        <div
          id={name + "-error-description"}
          className={fr.cx("fr-error-text")}
        >
          {typeof error === "string" ? error : "Indiquez au moins 1 métier."}
        </div>
      )}
    </div>
  );
};
