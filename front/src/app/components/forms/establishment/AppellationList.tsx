import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import React from "react";
import { AppellationDto, removeAtIndex } from "shared";
import { useStyles } from "tss-react/dsfr";
import { AppellationAutocomplete } from "../autocomplete/AppellationAutocomplete";

type AppellationListProps = {
  name: string;
  title?: string;
  value: AppellationDto[];
  onChange: (value: AppellationDto[]) => void;
  error?: string;
};

export const AppellationList = ({
  name,
  title,
  value,
  onChange,
  error,
}: AppellationListProps) => {
  const { cx } = useStyles();
  const appellations = value;

  const onDelete = (index: number) => {
    const newAppellations =
      appellations.length > 1
        ? removeAtIndex(appellations, index)
        : [
            {
              appellationCode: "",
              appellationLabel: "",
              romeCode: "",
              romeLabel: "",
            },
          ];
    onChange(newAppellations);
  };

  return (
    <div className={cx(fr.cx("fr-input-group"), "im-appellation-autocomplete")}>
      <>
        {title && <h2 className={fr.cx("fr-text--lead")}>{title}</h2>}
        {appellations.map(({ appellationCode }, index) => (
          <div
            className={fr.cx("fr-grid-row", "fr-grid-row--bottom")}
            key={`${appellationCode}-${index}`}
          >
            <div className={fr.cx("fr-col", "fr-mt-2w")}>
              <AppellationAutocomplete
                label={`Rechercher un métier * ${index}`}
                initialValue={value[index]}
                setFormValue={(selectedAppellation) => {
                  onChange([...value, selectedAppellation]);
                }}
                selectedAppellations={appellations}
              />
            </div>
            <Button
              type="button"
              iconId="fr-icon-delete-bin-line"
              title="Suppression"
              onClick={() => {
                onDelete(index);
              }}
            />
          </div>
        ))}
      </>

      <Button
        className={fr.cx("fr-my-4v")}
        type="button"
        iconId="fr-icon-add-line"
        title="Ajouter un métier"
        priority="secondary"
        onClick={() => {
          onChange([
            ...value,
            {
              romeCode: "",
              appellationCode: "",
              romeLabel: "",
              appellationLabel: "",
            },
          ]);
        }}
      >
        Ajouter un métier
      </Button>

      {error && error.length && (
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
