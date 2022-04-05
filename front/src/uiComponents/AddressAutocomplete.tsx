import Autocomplete from "@mui/material/Autocomplete";
import React, { useEffect, useState } from "react";
import { apiAdresseGateway } from "src/app/config/dependencies";
import { useDebounce } from "src/app/utils/useDebounce";
import { AddressWithCoordinates } from "src/core-logic/ports/ApiAdresseGateway";

type Option = AddressWithCoordinates;

export type AddressAutocompleteProps = {
  label: string;
  initialSearchTerm?: string;
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
  initialSearchTerm = "",
}: AddressAutocompleteProps) => {
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [options, setOptions] = useState<Option[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceSearchTerm = useDebounce(searchTerm, 400);

  const getAddressesFromApi = async (
    term: string,
  ): Promise<AddressWithCoordinates[]> => {
    const sanitizedTerm = term.trim();
    if (!sanitizedTerm) return [];
    try {
      setIsSearching(true);
      const addresses = await apiAdresseGateway.lookupStreetAddress(
        sanitizedTerm,
      );
      setOptions(addresses);
      return addresses;
    } catch (e: any) {
      console.error(e);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialSearchTerm && initialSearchTerm !== selectedOption?.label) {
      getAddressesFromApi(initialSearchTerm).then((addresses) =>
        setSelectedOption(addresses?.[0] ?? null),
      );
    }
  }, [initialSearchTerm]);

  useEffect(() => {
    if (
      debounceSearchTerm &&
      ![initialSearchTerm, selectedOption?.label].includes(debounceSearchTerm)
    ) {
      getAddressesFromApi(debounceSearchTerm);
    }
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
            placeholder="Rouen"
          />
        </div>
      )}
    />
  );
};
