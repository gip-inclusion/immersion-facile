import { useState } from "react";
import {
  RSAutocomplete,
  type RSAutocompleteComponentProps,
} from "react-design-system";
import { useDispatch } from "react-redux";
import type { LookupSearchResult } from "shared";
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
  const options = searchSuggestions
    ? searchSuggestions.map((suggestion) => ({
        value: suggestion,
        label: suggestion.label,
      }))
    : [];
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
