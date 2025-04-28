import { useState } from "react";
import {
  RSAutocomplete,
  type RSAutocompleteComponentProps,
} from "react-design-system";
import { useDispatch } from "react-redux";
import type { LookupSearchResult } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { geosearchSelectors } from "src/core-logic/domain/geosearch/geosearch.selectors";
import { geosearchSlice } from "src/core-logic/domain/geosearch/geosearch.slice";

export type PlaceAutocompleteProps = RSAutocompleteComponentProps<
  "place",
  LookupSearchResult,
  "searchPlace"
>;

export const PlaceAutocomplete = ({
  onPlaceSelected,
  onPlaceClear,
  ...props
}: PlaceAutocompleteProps) => {
  const dispatch = useDispatch();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const isSearching: boolean = useAppSelector(geosearchSelectors.isLoading);
  const isDebouncing: boolean = useAppSelector(geosearchSelectors.isDebouncing);
  const searchSuggestions = useAppSelector(geosearchSelectors.suggestions);
  const options = searchSuggestions.map((suggestion) => ({
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
        onChange: (searchResult, actionMeta) => {
          if (
            actionMeta.action === "clear" ||
            actionMeta.action === "remove-value"
          ) {
            geosearchSlice.actions.queryWasEmptied();
            onPlaceClear();
          }
          if (searchResult && actionMeta.action === "select-option") {
            onPlaceSelected(searchResult.value);
            dispatch(
              geosearchSlice.actions.suggestionHasBeenSelected(
                searchResult.value,
              ),
            );
            dispatch(geosearchSlice.actions.queryWasEmptied());
          }
        },
        options,
        onInputChange: (value) => {
          setSearchTerm(value);
          dispatch(geosearchSlice.actions.queryHasChanged(value));
        },
      }}
    />
  );
};
