import { fr } from "@codegouvfr/react-dsfr";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { useState } from "react";
import {
  RSAutocomplete,
  type RSAutocompleteComponentProps,
} from "react-design-system";
import { useDispatch } from "react-redux";
import {
  type AddressWithCountryCodeAndPosition,
  addressDtoToString,
  countryCodesData,
  defaultCountryCode,
  getCountryCodeFromAddress,
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
  withCountrySelect?: boolean;
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
  countryCode,
  withCountrySelect = false,
  initialInputValue,
  ...props
}: AddressAutocompleteProps) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] =
    useState<SupportedCountryCode | null>(null);

  const { value, options, isSearching, isDebouncing } = useAddressAutocomplete(
    props.locator,
  );

  const inputValue = searchTerm ?? initialInputValue;

  const countryOptions = Object.entries(countryCodesData).map(
    ([code, { name, flag }]) => ({
      value: code as SupportedCountryCode,
      label: `${flag} ${name}`,
    }),
  );

  const getSelectedCountryCode = () => {
    const countryCodeFromAddressValue = inputValue
      ? getCountryCodeFromAddress(inputValue)
      : null;
    if (countryCodeFromAddressValue) {
      return countryCodeFromAddressValue;
    }
    return selectedCountryCode ?? countryCode;
  };

  //biome-ignore lint/suspicious/noConsole: <explanation>
  console.log("searchTerm", searchTerm);

  return (
    <div className={fr.cx("fr-mb-2w")}>
      {withCountrySelect && (
        <div className={fr.cx("fr-mb-2w")}>
          <Select
            label="Pays où se déroulera l'immersion"
            options={countryOptions}
            nativeSelectProps={{
              value: getSelectedCountryCode(),
              onChange: (event) => {
                const newCountryCode = event.currentTarget
                  .value as SupportedCountryCode;
                setSelectedCountryCode(newCountryCode);
                setSearchTerm("");
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
      )}
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
                  countryCode:
                    withCountrySelect && selectedCountryCode
                      ? selectedCountryCode
                      : defaultCountryCode,
                }),
              );
            }
          },
        }}
      />
    </div>
  );
};
