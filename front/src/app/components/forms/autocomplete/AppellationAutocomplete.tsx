import { useState } from "react";
import {
  RSAutocomplete,
  type RSAutocompleteComponentProps,
} from "react-design-system";
import { useDispatch } from "react-redux";
import type { AppellationMatchDto } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { makeAppellationLocatorSelector } from "src/core-logic/domain/appellation/appellation.selectors";
import {
  type AppellationAutocompleteLocator,
  appellationSlice,
} from "src/core-logic/domain/appellation/appellation.slice";

export type AppellationAutocompleteProps = RSAutocompleteComponentProps<
  "appellation",
  AppellationMatchDto,
  AppellationAutocompleteLocator
>;

const useAppellationAutocomplete = (
  locator: AppellationAutocompleteLocator,
) => {
  const appellationLocatorSelector = useAppSelector(
    makeAppellationLocatorSelector(locator),
  );
  const options = appellationLocatorSelector?.suggestions
    ? appellationLocatorSelector.suggestions.map((suggestion) => ({
        value: suggestion,
        label: suggestion.appellation.appellationLabel,
      }))
    : [];
  const value = appellationLocatorSelector?.value;
  const isSearching = appellationLocatorSelector?.isLoading;
  const isDebouncing = appellationLocatorSelector?.isDebouncing;
  return {
    value,
    options,
    isSearching,
    isDebouncing,
  };
};

export const AppellationAutocomplete = ({
  onAppellationClear,
  onAppellationSelected,
  ...props
}: AppellationAutocompleteProps) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { value, options, isSearching, isDebouncing } =
    useAppellationAutocomplete(props.locator);
  return (
    <RSAutocomplete
      {...props}
      selectProps={{
        isDebouncing,
        inputId: props.selectProps?.inputId ?? "im-select__input--appellation",
        isLoading: isSearching,
        loadingMessage: () => <>Recherche de métiers en cours... 🔎</>,
        inputValue: searchTerm,
        placeholder: "Ex : Boulanger, styliste, etc.",
        value: value
          ? {
              label: value.appellation.appellationLabel,
              value: value,
            }
          : undefined,
        onChange: (searchResult, actionMeta) => {
          if (
            actionMeta.action === "clear" ||
            actionMeta.action === "remove-value"
          ) {
            appellationSlice.actions.emptyQueryRequested({
              locator: props.locator,
            });
            onAppellationClear();
          }
          if (searchResult && actionMeta.action === "select-option") {
            onAppellationSelected(searchResult.value);
            dispatch(
              appellationSlice.actions.selectSuggestionRequested({
                item: searchResult.value,
                locator: props.locator,
              }),
            );
            dispatch(
              appellationSlice.actions.emptyQueryRequested({
                locator: props.locator,
              }),
            );
          }
        },
        options,
        onInputChange: (newQuery) => {
          setSearchTerm(newQuery);
          dispatch(
            appellationSlice.actions.changeQueryRequested({
              locator: props.locator,
              lookup: newQuery,
            }),
          );
        },
      }}
    />
  );
};
