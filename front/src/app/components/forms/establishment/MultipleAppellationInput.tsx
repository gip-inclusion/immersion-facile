import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useStyles } from "tss-react/dsfr";
import { AppellationDto } from "shared";
import { AppellationAutocomplete } from "../autocomplete/AppellationAutocomplete";

type MultipleAppellationInputProps = {
  name: string;
  label?: string;
  currentAppellations: AppellationDto[];
  onAppellationAdd: (appellation: AppellationDto, index: number) => void;
  onAppellationDelete: (index: number) => void;
  error?: string;
};

export const emptyAppellation: AppellationDto = {
  romeCode: "",
  appellationCode: "",
  romeLabel: "",
  appellationLabel: "",
};

export const MultipleAppellationInput = ({
  name,
  label,
  currentAppellations,
  onAppellationAdd,
  onAppellationDelete,
  error,
}: MultipleAppellationInputProps) => {
  const { cx } = useStyles();

  return (
    <div className={cx(fr.cx("fr-input-group"), "im-appellation-autocomplete")}>
      <>
        {label && <h2 className={fr.cx("fr-text--lead")}>{label}</h2>}
        {currentAppellations.map(({ appellationCode }, index) => (
          <div
            className={fr.cx("fr-grid-row", "fr-grid-row--bottom")}
            key={`${appellationCode}-${index}`}
          >
            <div className={fr.cx("fr-col", "fr-mt-2w")}>
              <AppellationAutocomplete
                label={`Rechercher un métier *`}
                initialValue={currentAppellations[index]}
                onAppellationSelected={(selectedAppellation) => {
                  onAppellationAdd(selectedAppellation, index);
                }}
                selectedAppellations={currentAppellations}
              />
            </div>
            <Button
              type="button"
              iconId="fr-icon-delete-bin-line"
              title="Suppression"
              onClick={() => {
                onAppellationDelete(index);
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
          onAppellationAdd(emptyAppellation, currentAppellations.length);
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
