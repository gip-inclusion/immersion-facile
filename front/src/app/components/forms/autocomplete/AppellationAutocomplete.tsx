import { useState } from "react";
import {
  RSAutocomplete,
  type RSAutocompleteComponentProps,
} from "react-design-system";
import { useDispatch } from "react-redux";
import type { AppellationMatchDto } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { appellationSelectors } from "src/core-logic/domain/appellation/appellation.selectors";
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
  const value = useAppSelector(appellationSelectors.values);
  const options = useAppSelector(appellationSelectors.suggestions).map(
    (suggestion) => ({
      value: suggestion,
      label: suggestion.appellation.appellationLabel,
    }),
  );
  const isSearching = useAppSelector(appellationSelectors.isLoading);
  const isDebouncing = useAppSelector(appellationSelectors.isDebouncing);
  return {
    value: value?.[locator],
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
        inputId: props.selectProps?.inputId ?? "im-select__input--place",
        isLoading: isSearching,
        loadingMessage: () => <>Recherche de d'adresse en cours... 🔎</>,
        inputValue: searchTerm,
        placeholder: "Ex : 123 Rue de la Paix 75001 Paris",
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
            appellationSlice.actions.queryWasEmptied();
            onAppellationClear();
          }
          if (searchResult && actionMeta.action === "select-option") {
            onAppellationSelected(searchResult.value);
            dispatch(
              appellationSlice.actions.suggestionHasBeenSelected({
                appellationMatch: searchResult.value,
                appellationAutocompleteLocator: props.locator,
              }),
            );
            dispatch(appellationSlice.actions.queryWasEmptied());
          }
        },
        options,
        onInputChange: (newQuery) => {
          setSearchTerm(newQuery);
          dispatch(
            appellationSlice.actions.queryHasChanged({
              locator: props.locator,
              lookupAppellation: newQuery,
            }),
          );
        },
      }}
    />
  );
};
