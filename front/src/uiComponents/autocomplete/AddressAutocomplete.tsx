import React, { useEffect, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import { useDebounce } from "src/app/utils/useDebounce";
import { AddressWithCoordinates } from "src/core-logic/ports/ApiAdresseGateway";
import { getAddressesFromApi } from "./getAddressesFromApi";
import { AutocompleteInput } from "./AutocompleteInput";

export type AddressAutocompleteProps = {
  label: string;
  initialSearchTerm?: string;
  disabled?: boolean;
  headerClassName?: string;
  inputStyle?: React.CSSProperties;
  setFormValue: (p: AddressWithCoordinates) => void;
};

export const AddressAutocomplete = ({
  label,
  setFormValue,
  disabled,
  headerClassName,
  inputStyle,
  initialSearchTerm = "",
}: AddressAutocompleteProps) => {
  const [selectedOption, setSelectedOption] =
    useState<AddressWithCoordinates | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [options, setOptions] = useState<AddressWithCoordinates[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceSearchTerm = useDebounce(searchTerm, 400);

  useEffect(
    () =>
      useEffectInitialSearchTerm(
        initialSearchTerm,
        selectedOption,
        setOptions,
        setIsSearching,
        setSelectedOption,
      ),
    [initialSearchTerm],
  );

  useEffect(
    () =>
      useEffectDebounceSearchTerm(
        debounceSearchTerm,
        initialSearchTerm,
        selectedOption,
        setOptions,
        setIsSearching,
      ),
    [debounceSearchTerm],
  );

  const noOptionText =
    isSearching || !debounceSearchTerm ? "..." : "Aucune adresse trouvée";

  return (
    <Autocomplete
      disablePortal
      noOptionsText={searchTerm ? noOptionText : "Saisissez une adresse"}
      options={options}
      value={selectedOption}
      onChange={onAutocompleteChange(setSelectedOption, setFormValue)}
      onInputChange={onAutocompleteInput(setSearchTerm)}
      renderInput={AutocompleteInput(
        headerClassName,
        label,
        inputStyle,
        disabled,
      )}
    />
  );
};

const onAutocompleteInput =
  (setSearchTerm: React.Dispatch<React.SetStateAction<string>>) =>
  (_: React.SyntheticEvent<Element, Event>, newSearchTerm: string) =>
    setSearchTerm(newSearchTerm);

const onAutocompleteChange =
  (
    setSelectedOption: React.Dispatch<
      React.SetStateAction<AddressWithCoordinates | null>
    >,
    setFormValue: (p: AddressWithCoordinates) => void,
  ) =>
  (
    _: React.SyntheticEvent<Element, Event>,
    selectedOption: AddressWithCoordinates | null,
  ) => {
    setSelectedOption(selectedOption ?? null);
    setFormValue(
      selectedOption
        ? selectedOption
        : { label: "", coordinates: { lat: 0, lon: 0 } },
    );
  };

const useEffectDebounceSearchTerm = (
  debounceSearchTerm: string,
  initialSearchTerm: string,
  selectedOption: AddressWithCoordinates | null,
  setOptions: React.Dispatch<React.SetStateAction<AddressWithCoordinates[]>>,
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>,
): void => {
  if (
    debounceSearchTerm &&
    ![initialSearchTerm, selectedOption?.label].includes(debounceSearchTerm)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getAddressesFromApi(debounceSearchTerm, setOptions, setIsSearching);
  }
};

function useEffectInitialSearchTerm(
  initialSearchTerm: string,
  selectedOption: AddressWithCoordinates | null,
  setOptions: React.Dispatch<React.SetStateAction<AddressWithCoordinates[]>>,
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>,
  setSelectedOption: React.Dispatch<
    React.SetStateAction<AddressWithCoordinates | null>
  >,
): void {
  if (initialSearchTerm && initialSearchTerm !== selectedOption?.label) {
    getAddressesFromApi(initialSearchTerm, setOptions, setIsSearching)
      .then((addresses) => setSelectedOption(addresses?.[0] ?? null))
      .catch((error: any) => {
        // eslint-disable-next-line no-console
        console.error("getAddressesFromApi", error);
      });
  }
}
