import { fr } from "@codegouvfr/react-dsfr";
import Autocomplete from "@mui/material/Autocomplete";
import React, { useState } from "react";
import { AutocompleteInput } from "react-design-system";
import { useDispatch } from "react-redux";
import { LookupSearchResult } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { geosearchSelectors } from "src/core-logic/domain/geosearch/geosearch.selectors";
import { geosearchSlice } from "src/core-logic/domain/geosearch/geosearch.slice";
import { useStyles } from "tss-react/dsfr";

export type PlaceAutocompleteProps = {
  label: string;
  disabled?: boolean;
  headerClassName?: string;
  styles?: React.CSSProperties;
  placeholder?: string;
  description?: string;
  id?: string;
  inputValue?: string;
  initialInputValue?: string;
  onValueChange: (value: LookupSearchResult | null) => void;
  onInputClear: () => void;
};

export const PlaceAutocomplete = ({
  label,
  disabled,
  headerClassName,
  styles,
  placeholder = "Ex : Saint-Denis, La Réunion, France",
  description,
  onValueChange,
  onInputClear,
  initialInputValue,
  id = "im-place-autocomplete",
}: PlaceAutocompleteProps) => {
  const { cx } = useStyles();
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const isSearching: boolean = useAppSelector(geosearchSelectors.isLoading);
  const searchSuggestions = useAppSelector(geosearchSelectors.suggestions);
  const selectedPlace = useAppSelector(geosearchSelectors.value);
  const inputValue = useAppSelector(geosearchSelectors.query);
  const noOptionText = ({
    isSearching,
    debounceSearchTerm,
    searchTerm,
  }: {
    isSearching: boolean;
    debounceSearchTerm: string;
    searchTerm: string;
  }) => {
    if (!searchTerm) return "Saisissez le nom d'une ville";
    if (searchTerm.length < 3) return "Saisissez au moins 3 caractères";
    if (isSearching || searchTerm !== debounceSearchTerm)
      return "Recherche de ville en cours... 🔎";
    return "Aucun lieu trouvé";
  };
  const [inputHasChanged, setInputHasChanged] = useState(false);
  const getInputValue = () => {
    const isInitialRendering =
      !searchTerm && !selectedPlace && !inputHasChanged;
    const isPlaceSelected = !inputHasChanged && selectedPlace;
    if (isInitialRendering) return initialInputValue;
    if (isPlaceSelected) return selectedPlace.label;
    return searchTerm;
  };
  return (
    <div className={fr.cx("fr-input-group")}>
      <Autocomplete
        loading={isSearching}
        loadingText="Recherche de ville en cours... 🔎"
        disablePortal
        noOptionsText={noOptionText({
          isSearching,
          debounceSearchTerm: inputValue,
          searchTerm,
        })}
        inputValue={getInputValue()}
        options={searchSuggestions}
        value={selectedPlace}
        id={id}
        getOptionLabel={(option) => option.label ?? ""}
        onChange={(_, selectedPlace, reason) => {
          if (reason === "selectOption") {
            dispatch(
              geosearchSlice.actions.suggestionHasBeenSelected(selectedPlace),
            );
            onValueChange(selectedPlace);
            setInputHasChanged(false);
          }
        }}
        ListboxProps={{
          style: {
            maxHeight: "11rem",
          },
        }}
        onInputChange={(_, newInputValue, reason) => {
          setSearchTerm(newInputValue);
          if (reason === "input") {
            if (newInputValue === "") {
              dispatch(geosearchSlice.actions.queryWasEmptied());
              onInputClear();
            }
            if (inputValue !== newInputValue) {
              dispatch(geosearchSlice.actions.queryHasChanged(newInputValue));
              setInputHasChanged(true);
            }
          }
        }}
        filterOptions={(option) => option}
        renderInput={(params) => (
          <AutocompleteInput
            headerClassName={headerClassName}
            label={label}
            inputStyle={styles}
            disabled={disabled}
            placeholder={placeholder}
            id={id}
            params={params}
          />
        )}
      />
      {description && (
        <span className={cx("if-autocomplete-input__notice")}>
          {description}
        </span>
      )}
    </div>
  );
};
