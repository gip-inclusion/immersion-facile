import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { AddressDto, FormEstablishmentAddress } from "shared";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
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

  return (
    <div
      className={cx(fr.cx("fr-input-group"), "im-multiple-address-input")}
      id={id}
    >
      <>
        {label && <h2 className={fr.cx("fr-text--lead")}>{label}</h2>}
        {hintText && <p className={fr.cx("fr-hint-text")}>{hintText}</p>}
        {currentAddresses.map((address, index) => (
          <div
            className={fr.cx("fr-grid-row", "fr-grid-row--bottom")}
            key={address.id}
          >
            <div className={fr.cx("fr-col", "fr-mt-2w")}>
              <AddressAutocomplete
                disabled={disabled}
                label={"Rechercher un lieu *"}
                initialSearchTerm={currentAddresses[index].rawAddress}
                useFirstAddressOnInitialSearchTerm={false}
                id={`${id}-${index}`}
                setFormValue={({ address }) => {
                  onAddressAdded(address, index);
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
              }}
            />
          </div>
        ))}
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
