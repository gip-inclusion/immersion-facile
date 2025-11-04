import { fr } from "@codegouvfr/react-dsfr";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { useState } from "react";
import type { RSAutocompleteComponentProps } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type AddressWithCountryCodeAndPosition,
  countryCodesData,
  defaultCountryCode,
  getCountryCodeFromAddress,
  type SupportedCountryCode,
} from "shared";
import {
  type AddressAutocompleteLocator,
  geocodingSlice,
} from "src/core-logic/domain/geocoding/geocoding.slice";
import { AddressAutocomplete } from "./AddressAutocomplete";

export type AddressAutocompleteWithCountrySelectProps =
  RSAutocompleteComponentProps<
    "address",
    AddressWithCountryCodeAndPosition,
    AddressAutocompleteLocator
  > & {
    countryCode?: SupportedCountryCode;
  };

export const AddressAutocompleteWithCountrySelect = ({
  onAddressClear,
  onAddressSelected,
  multiple,
  countryCode,
  initialInputValue,
  ...props
}: AddressAutocompleteWithCountrySelectProps) => {
  const dispatch = useDispatch();
  const [selectedCountryCode, setSelectedCountryCode] =
    useState<SupportedCountryCode | null>(null);

  const [inputValue, setInputValue] = useState<string | undefined>(
    initialInputValue,
  );

  const getSelectedCountryCode = () => {
    if (selectedCountryCode) {
      return selectedCountryCode;
    }
    if (inputValue) {
      return getCountryCodeFromAddress(inputValue);
    }
    return countryCode ?? defaultCountryCode;
  };

  const selectedCountryCodeValue = getSelectedCountryCode();

  const countryOptions = Object.entries(countryCodesData).map(
    ([code, { name, flag }]) => ({
      value: code as SupportedCountryCode,
      label: `${flag} ${name}`,
      selected: code === selectedCountryCodeValue,
    }),
  );

  return (
    <div className={fr.cx("fr-mb-2w")}>
      <div className={fr.cx("fr-mb-2w")}>
        <Select
          label="Pays où se déroulera l'immersion"
          options={countryOptions}
          nativeSelectProps={{
            value: selectedCountryCodeValue,
            onChange: (event) => {
              const newCountryCode = event.currentTarget
                .value as SupportedCountryCode;
              setSelectedCountryCode(newCountryCode);
              setInputValue("");
              dispatch(
                geocodingSlice.actions.emptyQueryRequested({
                  locator: props.locator,
                }),
              );
              dispatch(
                geocodingSlice.actions.clearLocatorDataRequested({
                  locator: props.locator,
                  multiple,
                }),
              );
              onAddressClear();
              dispatch(
                geocodingSlice.actions.changeQueryRequested({
                  locator: props.locator,
                  lookup: "",
                  countryCode: newCountryCode,
                }),
              );
            },
          }}
        />
      </div>
      <AddressAutocomplete
        {...props}
        onAddressClear={onAddressClear}
        onAddressSelected={onAddressSelected}
        multiple={multiple}
        countryCode={selectedCountryCodeValue}
        initialInputValue={inputValue}
      />
    </div>
  );
};
