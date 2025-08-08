import { fr } from "@codegouvfr/react-dsfr";
import { useState } from "react";
import {
  RSAutocomplete,
  type RSAutocompleteComponentProps,
} from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type AddressWithCountryCodeAndPosition,
  addressDtoToString,
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
  const options = (geocodingLocatorSelector?.suggestions ?? []).map(
    (suggestion) => ({
      value: suggestion,
      label: addressDtoToString(suggestion.address),
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
    <div className={fr.cx("fr-mb-2w")}>
      <RSAutocomplete
        {...props}
        selectProps={{
          isDebouncing,
          inputId: props.selectProps?.inputId ?? "im-select__input--address",
          isLoading: isSearching,
          loadingMessage: () => <>Recherche d'adresses en cours... 🔎</>,
          inputValue,
          placeholder: "Ex : 123 Rue de la Paix 75001 Paris",
          value:
            value && !Array.isArray(value)
              ? {
                  label: addressDtoToString(value?.address),
                  value,
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
              // biome-ignore lint/suspicious/noConsole: <explanation>
              console.log("onAddressSelected", searchResult.label);
              setSearchTerm(searchResult.label);
            }
          },
          options,
          onInputChange: (newQuery, actionMeta) => {
            // biome-ignore lint/suspicious/noConsole: <explanation>
            console.log("onInputChange", {
              newQuery,
              actionMeta,
            });
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
    </div>
  );
};
