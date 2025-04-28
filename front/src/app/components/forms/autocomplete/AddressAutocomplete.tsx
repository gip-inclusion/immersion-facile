import { useState } from "react";
import {
  RSAutocomplete,
  type RSAutocompleteComponentProps,
} from "react-design-system";
import { useDispatch } from "react-redux";
import { type AddressAndPosition, addressDtoToString } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { geocodingSelectors } from "src/core-logic/domain/geocoding/geocoding.selectors";
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
  const value = useAppSelector(geocodingSelectors.value);
  const options = useAppSelector(geocodingSelectors.suggestions).map(
    (suggestion) => ({
      value: suggestion,
      label: addressDtoToString(suggestion.address),
    }),
  );
  const isSearching = useAppSelector(geocodingSelectors.isLoading);
  const isDebouncing = useAppSelector(geocodingSelectors.isDebouncing);
  return {
    value: value?.[locator],
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
        inputId: props.selectProps?.inputId ?? "im-select__input--place",
        isLoading: isSearching,
        loadingMessage: () => <>Recherche de d'adresse en cours... 🔎</>,
        inputValue: searchTerm,
        placeholder: "Ex : 123 Rue de la Paix 75001 Paris",
        value: value
          ? {
              label: addressDtoToString(value.address),
              value: value,
            }
          : undefined,
        onChange: (searchResult, actionMeta) => {
          if (
            actionMeta.action === "clear" ||
            actionMeta.action === "remove-value"
          ) {
            geocodingSlice.actions.queryWasEmptied();
            onAddressClear();
          }
          if (searchResult && actionMeta.action === "select-option") {
            onAddressSelected(searchResult.value);
            dispatch(
              geocodingSlice.actions.suggestionHasBeenSelected({
                addressAndPosition: searchResult.value,
                addressAutocompleteLocator: props.locator,
              }),
            );
            dispatch(geocodingSlice.actions.queryWasEmptied());
          }
        },
        options,
        onInputChange: (newQuery) => {
          setSearchTerm(newQuery);
          dispatch(
            geocodingSlice.actions.queryHasChanged({
              locator: props.locator,
              lookupAddress: newQuery,
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
