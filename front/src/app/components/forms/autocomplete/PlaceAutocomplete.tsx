import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import Autocomplete from "@mui/material/Autocomplete";
import { useStyles } from "tss-react/dsfr";

import { LookupSearchResult } from "shared";

import { AutocompleteInput } from "react-design-system";

import { useAppSelector } from "src/app/hooks/reduxHooks";
import { geosearchSelectors } from "src/core-logic/domain/geosearch/geosearch.selectors";
import { geosearchSlice } from "src/core-logic/domain/geosearch/geosearch.slice";

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
  const isSearching: boolean = useAppSelector(geosearchSelectors.isLoading);
  const searchSuggestions = useAppSelector(geosearchSelectors.suggestions);
  const selectedPlace = useAppSelector(geosearchSelectors.value);
  const inputValue = useAppSelector(geosearchSelectors.query);
  const noOptionText = isSearching ? "..." : "Aucun lieu trouvé 😥";
  const [inputHasChanged, setInputHasChanged] = useState(false);
  const getInputValue = () => {
    const isInitialRendering =
      !inputValue && !selectedPlace && !inputHasChanged;
    const isPlaceSelected = !inputHasChanged && selectedPlace;
    if (isInitialRendering) return initialInputValue;
    if (isPlaceSelected) return selectedPlace.label;
    return inputValue;
  };
  return (
    <div className={fr.cx("fr-input-group")}>
      <Autocomplete
        loading={isSearching}
        loadingText="Recherche de ville en cours... 🔎"
        disablePortal
        noOptionsText={
          inputValue ? noOptionText : "Saisissez un lieu ou une ville ⌨️"
        }
        inputValue={getInputValue()}
        options={searchSuggestions}
        value={selectedPlace}
        id={id}
        getOptionLabel={(option) => option.label}
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
          if (reason === "input") {
            if (newInputValue === "") onInputClear();
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
