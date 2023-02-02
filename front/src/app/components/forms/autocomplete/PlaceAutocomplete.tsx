import Autocomplete from "@mui/material/Autocomplete";
import React from "react";
import { AutocompleteInput } from "react-design-system";
import { LookupSearchResult } from "shared";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import { useDispatch } from "react-redux";
import { geosearchSlice } from "src/core-logic/domain/geosearch/geosearch.slice";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { geosearchSelectors } from "src/core-logic/domain/geosearch/geosearch.selectors";

export type PlaceAutocompleteProps = {
  label: string;
  initialValue?: string;
  disabled?: boolean;
  headerClassName?: string;
  styles?: React.CSSProperties;
  placeholder?: string;
  description?: string;
  id?: string;
  onValueChange: (value: LookupSearchResult | null) => void;
  onInputValueChange: (inputValue: string | undefined) => void;
  inputValue: string;
};

export const PlaceAutocomplete = ({
  label,
  disabled,
  headerClassName,
  styles,
  initialValue = "",
  placeholder = "Ex : Saint-Emilion",
  description,
  onValueChange,
  inputValue = "",
  onInputValueChange,
  id = "im-place-autocomplete",
}: PlaceAutocompleteProps) => {
  const { cx } = useStyles();
  const dispatch = useDispatch();

  const suggestions = useAppSelector(geosearchSelectors.suggestions);
  const isLoading = useAppSelector(geosearchSelectors.isLoading);
  const value = useAppSelector(geosearchSelectors.value);
  const noOptionText = () => {
    if (isLoading) return "...";
    if (!isLoading && suggestions.length === 0) return "Aucun lieu trouvé 😥";
    return "Saisissez un lieu ou une ville ⌨️";
  };
  const onInputChange = (value: string) => {
    dispatch(geosearchSlice.actions.queryHasChanged(value));
    onInputValueChange(value);
  };
  const onValueSelected = (value: LookupSearchResult | null) => {
    dispatch(geosearchSlice.actions.suggestionHaveBeenSelected(value));
    onValueChange(value);
  };
  return (
    <div className={fr.cx("fr-input-group")}>
      <Autocomplete
        loading={isLoading}
        loadingText="Recherche de ville en cours... 🔎"
        disablePortal
        noOptionsText={noOptionText()}
        options={suggestions}
        inputValue={inputValue || initialValue}
        value={value}
        id={id}
        getOptionLabel={(option) => option.label}
        onChange={(_, value) => onValueSelected(value)}
        onInputChange={(_, inputValue) => onInputChange(inputValue)}
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
