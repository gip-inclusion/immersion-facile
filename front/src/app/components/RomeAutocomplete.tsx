import Autocomplete from "@mui/material/Autocomplete";
import React from "react";
import { RomeDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { useRomeAutocompleteUseCase } from "src/app/components/romeAutocomplete.hook";
import { romeAutocompleteSelector } from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.selectors";

type RomeAutocompleteProps = {
  title: string;
  initialValue?: RomeDto | undefined;
  setFormValue: (p: RomeDto) => void;
  className?: string;
};

export const RomeAutocomplete = ({
  setFormValue,
  title,
  className,
}: RomeAutocompleteProps) => {
  const { romeSearchText, isSearching, selectedRomeDto, romeOptions } =
    useAppSelector(romeAutocompleteSelector);
  const { updateSearchTerm, selectOption } = useRomeAutocompleteUseCase();

  const noOptionText =
    isSearching || !romeSearchText ? "..." : "Aucun métier trouvé";

  return (
    <>
      <Autocomplete
        disablePortal
        filterOptions={(x) => x}
        options={romeOptions}
        value={selectedRomeDto}
        noOptionsText={romeSearchText ? noOptionText : "Saisissez un métier"}
        getOptionLabel={(option: RomeDto) => option.romeLabel}
        renderOption={(props, option) => <li {...props}>{option.romeLabel}</li>}
        onChange={(_, selectedRomeDto: RomeDto | null) => {
          selectOption(selectedRomeDto ?? null);
          setFormValue(
            selectedRomeDto ?? {
              romeCode: "",
              romeLabel: "",
            },
          );
        }}
        onInputChange={(_, newSearchTerm) => {
          updateSearchTerm(newSearchTerm);
        }}
        renderInput={(params) => (
          <div ref={params.InputProps.ref}>
            <label className={`fr-label ${className ?? ""}`} htmlFor={"search"}>
              {title}
            </label>
            <input
              {...params.inputProps}
              className={"fr-input"}
              placeholder="Prêt à porter"
            />
          </div>
        )}
      />
    </>
  );
};
