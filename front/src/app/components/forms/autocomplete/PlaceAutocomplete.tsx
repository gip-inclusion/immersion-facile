import Autocomplete from "@mui/material/Autocomplete";
import React, { useState } from "react";
import { AutocompleteInput } from "react-design-system";
import { LookupSearchResult } from "shared";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { geosearchSelectors } from "src/core-logic/domain/geosearch/geosearch.selectors";
import { useDispatch } from "react-redux";
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
};

export const PlaceAutocomplete = ({
  label,
  disabled,
  headerClassName,
  styles,
  placeholder = "Ex : Saint-Emilion",
  description,
  onValueChange,
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
    if (!inputValue && !selectedPlace && !inputHasChanged)
      return initialInputValue;
    if (!inputValue && selectedPlace && inputHasChanged)
      return selectedPlace.label;
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
        onChange={(_, value) => {
          dispatch(geosearchSlice.actions.suggestionHaveBeenSelected(value));
          onValueChange(value);
        }}
        onInputChange={(_, newInputValue) => {
          if (inputValue !== newInputValue) {
            dispatch(geosearchSlice.actions.queryHasChanged(newInputValue));
            setInputHasChanged(true);
          }
        }}
        filterOptions={(option) => option}
        renderInput={AutocompleteInput(
          headerClassName,
          label,
          styles,
          disabled,
          placeholder,
          id,
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
