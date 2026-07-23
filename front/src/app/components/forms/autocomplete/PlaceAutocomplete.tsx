import { useState } from "react";
import {
  type OptionType,
  RSAutocomplete,
  type RSAutocompleteComponentProps,
} from "react-design-system";
import { useDispatch } from "react-redux";
import type { PropsValue } from "react-select";
import type { LookupSearchResult } from "shared";
import { isSingleOption } from "src/app/components/forms/autocomplete/autocomplete.utils";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { makeGeosearchLocatorSelector } from "src/core-logic/domain/geosearch/geosearch.selectors";
import {
  type GeosearchLocator,
  geosearchSlice,
} from "src/core-logic/domain/geosearch/geosearch.slice";

export type PlaceAutocompleteProps = RSAutocompleteComponentProps<
  "place",
  LookupSearchResult,
  GeosearchLocator
>;

const getAutocompleteValue = (
  value?: LookupSearchResult | null,
  defaultValue?: PropsValue<OptionType<LookupSearchResult>>,
  searchTerm?: string,
): OptionType<LookupSearchResult> | null => {
  if (searchTerm === "" && defaultValue === undefined) return null;
  if (value)
    return {
      label: value.label,
      value: value,
    };
  if (defaultValue && isSingleOption(defaultValue)) return defaultValue;
  return null;
};

export const PlaceAutocomplete = ({
  onPlaceSelected,
  onPlaceClear,
  ...props
}: PlaceAutocompleteProps) => {
  const dispatch = useDispatch();
  const geosearchLocatorSelector = useAppSelector(
    makeGeosearchLocatorSelector(props.locator),
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const isSearching = geosearchLocatorSelector?.isLoading;
  const isDebouncing = geosearchLocatorSelector?.isDebouncing;
  const searchSuggestions = geosearchLocatorSelector?.suggestions;
  const options = (searchSuggestions ?? []).map((suggestion) => ({
    value: suggestion,
    label: suggestion.label,
  }));
  return (
    <RSAutocomplete
      {...props}
      selectProps={{
        isDebouncing,
        inputId: props.selectProps?.inputId ?? "im-select__input--place",
        isLoading: isSearching,
        loadingMessage: () => <>Recherche de ville en cours... 🔎</>,
        inputValue: searchTerm,
        placeholder: "Ex : Saint-Denis, La Réunion, France",
        value: getAutocompleteValue(
          geosearchLocatorSelector?.value,
          props.selectProps?.defaultValue,
          searchTerm,
        ),
        onChange: (searchResult, actionMeta) => {
          if (
            actionMeta.action === "clear" ||
            actionMeta.action === "remove-value"
          ) {
            geosearchSlice.actions.emptyQueryRequested({
              locator: props.locator,
            });
            onPlaceClear();
          }
          if (searchResult && actionMeta.action === "select-option") {
            onPlaceSelected(searchResult.value);
            dispatch(
              geosearchSlice.actions.selectSuggestionRequested({
                item: searchResult.value,
                locator: props.locator,
              }),
            );
            dispatch(
              geosearchSlice.actions.emptyQueryRequested({
                locator: props.locator,
              }),
            );
          }
        },
        options,
        onInputChange: (value) => {
          setSearchTerm(value);
          dispatch(
            geosearchSlice.actions.changeQueryRequested({
              locator: props.locator,
              lookup: value,
            }),
          );
        },
      }}
    />
  );
};
