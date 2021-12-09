import Autocomplete from "@mui/material/Autocomplete";
import { useField } from "formik";
import React, { useEffect, useState } from "react";
import { apiAdresseGateway } from "src/app/dependencies";
import { useDebounce } from "src/app/useDebounce";
import { AddressWithCoordinates } from "src/core-logic/ports/ApiAdresseGateway";

type Option = AddressWithCoordinates;

export type AddressAutocompleteProps = {
  label: string;
  disabled?: boolean;
  headerClassName?: string;
  inputStyle?: React.CSSProperties;
  setFormValue: (p: Option) => void;
};

export const AddressAutocomplete = ({
  label,
  setFormValue,
  disabled,
  headerClassName,
  inputStyle,
}: AddressAutocompleteProps) => {
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [options, setOptions] = useState<Option[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceSearchTerm = useDebounce(searchTerm, 400);

  useEffect(() => {
    (async () => {
      const sanitizedTerm = debounceSearchTerm.trim();
      if (!sanitizedTerm) return [];
      try {
        setIsSearching(true);
        const addresses = await apiAdresseGateway.lookupStreetAddress(
          sanitizedTerm,
        );
        setOptions(addresses);
      } catch (e: any) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    })();
  }, [debounceSearchTerm]);

  const noOptionText =
    isSearching || !debounceSearchTerm ? "..." : "Aucune adresse trouvée";

  return (
    <Autocomplete
      disablePortal
      noOptionsText={searchTerm ? noOptionText : "Saisissez une adresse"}
      options={options}
      value={selectedOption}
      onChange={(_, selectedOption: Option | null) => {
        setSelectedOption(selectedOption ?? null);
        setFormValue(
          selectedOption
            ? selectedOption
            : { label: "", coordinates: { lat: 0, lon: 0 } },
        );
      }}
      onInputChange={(_, newSearchTerm) => {
        setSearchTerm(newSearchTerm);
      }}
      renderInput={(params) => (
        <div ref={params.InputProps.ref}>
          <label
            className={`fr-label ${headerClassName ?? ""}`}
            htmlFor={"search"}
          >
            {label}
          </label>
          <input
            {...params.inputProps}
            style={inputStyle}
            disabled={disabled}
            className={"fr-input"}
          />
        </div>
      )}
    />
  );
};
