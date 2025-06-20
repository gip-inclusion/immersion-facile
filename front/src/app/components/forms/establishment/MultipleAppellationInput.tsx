import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useDispatch } from "react-redux";
import {
  type AppellationAndRomeDto,
  type AppellationCode,
  type AppellationLabel,
  emptyAppellationAndRome,
} from "shared";
import {
  type AppellationAutocompleteLocator,
  appellationSlice,
} from "src/core-logic/domain/appellation/appellation.slice";
import { useStyles } from "tss-react/dsfr";
import { v4 as uuidV4 } from "uuid";
import { AppellationAutocomplete } from "../autocomplete/AppellationAutocomplete";

type MultipleAppellationInputProps = {
  name: string;
  label?: string;
  currentAppellations: AppellationAndRomeDto[];
  onAppellationAdd: (appellation: AppellationAndRomeDto, index: number) => void;
  onAppellationDelete: (index: number) => void;
  error?: string;
  id: string;
  disabled?: boolean;
};

const getAppellationKey = (
  appellationCode: AppellationCode,
  appellationLabel: AppellationLabel,
) => {
  if (appellationCode === "" && appellationLabel === "") return uuidV4();
  return `${appellationCode}-${appellationLabel}`;
};

export const MultipleAppellationInput = ({
  name,
  label,
  currentAppellations,
  onAppellationAdd,
  onAppellationDelete,
  error,
  id,
  disabled = false,
}: MultipleAppellationInputProps) => {
  const { cx } = useStyles();
  const dispatch = useDispatch();
  return (
    <div
      className={cx(fr.cx("fr-input-group"), "im-appellation-autocomplete")}
      id={id}
    >
      <>
        {label && <h2 className={fr.cx("fr-text--lead")}>{label}</h2>}
        {currentAppellations.map(
          ({ appellationCode, appellationLabel }, index) => {
            const key = getAppellationKey(appellationCode, appellationLabel);
            const locator: AppellationAutocompleteLocator = `multiple-appellation-${index}`;
            return (
              <div
                className={fr.cx("fr-grid-row", "fr-grid-row--bottom")}
                key={key}
              >
                <div className={fr.cx("fr-col", !!index && "fr-mt-2w")}>
                  <AppellationAutocomplete
                    locator={locator}
                    disabled={disabled}
                    multiple
                    label={"Rechercher un métier *"}
                    onAppellationSelected={(selectedAppellationMatch) => {
                      onAppellationAdd(
                        selectedAppellationMatch.appellation,
                        index,
                      );
                    }}
                    onAppellationClear={() => {
                      onAppellationDelete(index);
                    }}
                    selectProps={{
                      inputId: `${id}-${index}`,
                    }}
                  />
                </div>
                <Button
                  type="button"
                  iconId="fr-icon-delete-bin-line"
                  title="Suppression"
                  disabled={disabled}
                  id="im-multiple-appellation-input__delete-option-button"
                  onClick={() => {
                    onAppellationDelete(index);
                    dispatch(
                      appellationSlice.actions.clearLocatorDataRequested({
                        locator,
                        multiple: true,
                      }),
                    );
                  }}
                />
              </div>
            );
          },
        )}
      </>
      <Button
        className={fr.cx("fr-my-4v")}
        type="button"
        iconId="fr-icon-add-line"
        title="Ajouter un métier"
        id={`${id}-add-option-button`}
        priority="secondary"
        onClick={() => {
          onAppellationAdd(emptyAppellationAndRome, currentAppellations.length);
        }}
        disabled={disabled}
      >
        Ajouter un métier
      </Button>
      {error?.length && (
        <div
          id={`${name}-error-description`}
          className={fr.cx("fr-error-text")}
        >
          {typeof error === "string" ? error : "Indiquez au moins 1 métier."}
        </div>
      )}
    </div>
  );
};
