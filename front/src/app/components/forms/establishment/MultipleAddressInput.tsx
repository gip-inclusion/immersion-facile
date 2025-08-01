import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useDispatch } from "react-redux";
import type { AddressDto, FormEstablishmentAddress } from "shared";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import {
  type AddressAutocompleteLocator,
  geocodingSlice,
} from "src/core-logic/domain/geocoding/geocoding.slice";
import { useStyles } from "tss-react/dsfr";

type MultipleAddressInputProps = {
  name: string;
  label?: string;
  hintText?: string;
  currentAddresses: FormEstablishmentAddress[];
  onAddressAdded: (address: AddressDto, index: number) => void;
  onAddressDeleted: (index: number) => void;
  error?: string;
  id: string;
  disabled?: boolean;
};

export const MultipleAddressInput = ({
  name,
  label,
  currentAddresses,
  onAddressAdded,
  onAddressDeleted,
  error,
  id,
  disabled = false,
  hintText,
}: MultipleAddressInputProps) => {
  const { cx } = useStyles();
  const dispatch = useDispatch();
  return (
    <div
      className={cx(fr.cx("fr-input-group"), "im-multiple-address-input")}
      id={id}
    >
      <>
        {label && <h2 className={fr.cx("fr-text--lead")}>{label}</h2>}
        {hintText && <p className={fr.cx("fr-hint-text")}>{hintText}</p>}
        {currentAddresses.map((address, index) => {
          const locator: AddressAutocompleteLocator = `multiple-address-${index}`;
          return (
            <div
              className={fr.cx("fr-grid-row", "fr-grid-row--bottom")}
              key={address.id}
            >
              <div className={fr.cx("fr-col", "fr-mt-2w")}>
                <AddressAutocomplete
                  countryCode="FR"
                  multiple
                  disabled={disabled}
                  locator={locator}
                  label={"Rechercher un lieu *"}
                  selectProps={{
                    inputId: `${id}-${index}`,
                  }}
                  onAddressSelected={(addressAndPosition) => {
                    onAddressAdded(addressAndPosition.address, index);
                  }}
                  onAddressClear={() => {
                    onAddressDeleted(index);
                  }}
                />
              </div>
              <Button
                type="button"
                iconId="fr-icon-delete-bin-line"
                title="Suppression"
                disabled={disabled}
                id={`${id}-delete-option-button-${index}`}
                onClick={() => {
                  onAddressDeleted(index);
                  dispatch(
                    geocodingSlice.actions.clearLocatorDataRequested({
                      locator,
                      multiple: true,
                    }),
                  );
                }}
              />
            </div>
          );
        })}
      </>
      <Button
        className={fr.cx("fr-my-4v")}
        type="button"
        iconId="fr-icon-add-line"
        title="Ajouter un lieu d'immersion"
        id={`${id}-add-option-button`}
        priority="secondary"
        onClick={() => {
          onAddressAdded(
            {
              city: "",
              postcode: "",
              streetNumberAndAddress: "",
              departmentCode: "",
            },
            currentAddresses.length,
          );
        }}
        disabled={disabled}
      >
        Ajouter un lieu d'immersion
      </Button>
      {error?.length && (
        <div
          id={`${name}-error-description`}
          className={fr.cx("fr-error-text")}
        >
          {typeof error === "string"
            ? error
            : "Indiquez au moins un lieu d'immersion."}
        </div>
      )}
    </div>
  );
};
