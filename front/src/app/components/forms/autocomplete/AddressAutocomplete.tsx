import { useState } from "react";
import {
  RSAutocomplete,
  type RSAutocompleteComponentProps,
} from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type AddressWithCountryCodeAndPosition,
  defaultCountryCode,
  type SupportedCountryCode,
} from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { makeGeocodingLocatorSelector } from "src/core-logic/domain/geocoding/geocoding.selectors";
import {
  type AddressAutocompleteLocator,
  geocodingSlice,
} from "src/core-logic/domain/geocoding/geocoding.slice";

export type AddressAutocompleteProps = RSAutocompleteComponentProps<
  "address",
  AddressWithCountryCodeAndPosition,
  AddressAutocompleteLocator
> & {
  countryCode?: SupportedCountryCode;
};

const useAddressAutocomplete = (locator: AddressAutocompleteLocator) => {
  const geocodingLocatorSelector = useAppSelector(
    makeGeocodingLocatorSelector(locator),
  );
  const options: {
    value: AddressWithCountryCodeAndPosition;
    label: string;
  }[] = (geocodingLocatorSelector?.suggestions ?? []).map(
    ({ address, formattedAddress, position }) => ({
      value: { address, position },
      label: formattedAddress,
    }),
  );
  const value = geocodingLocatorSelector?.value;
  const isSearching = geocodingLocatorSelector?.isLoading;
  const isDebouncing = geocodingLocatorSelector?.isDebouncing;
  return {
    value,
    options,
    isSearching,
    isDebouncing,
  };
};

export const AddressAutocomplete = ({
  onAddressClear,
  onAddressSelected,
  multiple,
  countryCode = defaultCountryCode,
  initialInputValue,
  ...props
}: AddressAutocompleteProps) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState<string | null>(null);

  const { value, options, isSearching, isDebouncing } = useAddressAutocomplete(
    props.locator,
  );

  const inputValue = searchTerm ?? initialInputValue;

  return (
    <RSAutocomplete
      {...props}
      selectProps={{
        isDebouncing,
        defaultValue: props.selectProps?.defaultValue,
        inputId: props.selectProps?.inputId ?? "im-select__input--address",
        isLoading: isSearching,
        loadingMessage: () => <>Recherche d'adresses en cours... 🔎</>,
        inputValue,
        placeholder: "Ex : 123 Rue de la Paix 75001 Paris",
        value:
          value && !Array.isArray(value)
            ? {
                label: value.formattedAddress,
                value: { address: value.address, position: value.position },
              }
            : undefined,
        onChange: (searchResult, actionMeta) => {
          if (
            actionMeta.action === "clear" ||
            actionMeta.action === "remove-value"
          ) {
            dispatch(
              geocodingSlice.actions.clearLocatorDataRequested({
                locator: props.locator,
                multiple,
              }),
            );
            setSearchTerm("");
            onAddressClear();
          }
          if (searchResult && actionMeta.action === "select-option") {
            onAddressSelected(searchResult.value);
            dispatch(
              geocodingSlice.actions.selectSuggestionRequested({
                item: searchResult.value,
                locator: props.locator,
              }),
            );
            dispatch(
              geocodingSlice.actions.emptyQueryRequested({
                locator: props.locator,
              }),
            );
            setSearchTerm(searchResult.label);
          }
        },
        options,
        onInputChange: (newQuery, actionMeta) => {
          if (actionMeta.action === "input-change") {
            setSearchTerm(newQuery);
            dispatch(
              geocodingSlice.actions.changeQueryRequested({
                locator: props.locator,
                lookup: newQuery,
                countryCode,
              }),
            );
          }
        },
      }}
    />
  );
};
