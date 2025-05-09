import { useState } from "react";
import {
  RSAutocomplete,
  type RSAutocompleteComponentProps,
} from "react-design-system";
import { useDispatch } from "react-redux";
import { type AddressAndPosition, addressDtoToString } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { makeGeocodingLocatorSelector } from "src/core-logic/domain/geocoding/geocoding.selectors";
import {
  type AddressAutocompleteLocator,
  geocodingSlice,
} from "src/core-logic/domain/geocoding/geocoding.slice";

export type AddressAutocompleteProps = RSAutocompleteComponentProps<
  "address",
  AddressAndPosition,
  AddressAutocompleteLocator
>;

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
  ...props
}: AddressAutocompleteProps) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { value, options, isSearching, isDebouncing } = useAddressAutocomplete(
    props.locator,
  );
  return (
    <RSAutocomplete
      {...props}
      selectProps={{
        isDebouncing,
        inputId: props.selectProps?.inputId ?? "im-select__input--address",
        isLoading: isSearching,
        loadingMessage: () => <>Recherche d'adresses en cours... 🔎</>,
        inputValue: searchTerm,
        placeholder: "Ex : 123 Rue de la Paix 75001 Paris",
        value: value
          ? {
              label: addressDtoToString(value?.address),
              value: value,
            }
          : undefined,
        onChange: (searchResult, actionMeta) => {
          if (
            actionMeta.action === "clear" ||
            actionMeta.action === "remove-value"
          ) {
            geocodingSlice.actions.clearLocatorDataRequested({
              locator: props.locator,
            });
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
          }
        },
        options,
        onInputChange: (newQuery) => {
          setSearchTerm(newQuery);
          dispatch(
            geocodingSlice.actions.changeQueryRequested({
              locator: props.locator,
              lookup: newQuery,
            }),
          );
        },
      }}
    />
  );
};

export const addressStringToFakeAddressAndPosition = (
  address: string,
): AddressAndPosition => ({
  address: {
    streetNumberAndAddress: address,
    postcode: "",
    departmentCode: "",
    city: "",
  },
  position: { lat: 0, lon: 0 },
});
