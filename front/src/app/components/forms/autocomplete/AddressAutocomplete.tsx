import Autocomplete from "@mui/material/Autocomplete";
import React, { useEffect, useState } from "react";
import { AutocompleteInput } from "react-design-system";
import { AddressAndPosition, addressDtoToString } from "shared";
import { useDebounce } from "src/app/hooks/useDebounce";
import { getAddressesFromApi } from "./getAddressesFromApi";
import { useStyles } from "tss-react/dsfr";

export type AddressAutocompleteProps = {
  label: string;
  initialSearchTerm?: string;
  disabled?: boolean;
  headerClassName?: string;
  inputStyle?: React.CSSProperties;
  setFormValue: (p: AddressAndPosition) => void;
  placeholder?: string;
  notice?: string;
  id?: string;
};

export const AddressAutocomplete = ({
  label,
  setFormValue,
  disabled,
  headerClassName,
  inputStyle,
  initialSearchTerm = "",
  placeholder = "Ex : Bordeaux 33000",
  notice,
  id = "im-address-autocomplete",
}: AddressAutocompleteProps) => {
  const [selectedOption, setSelectedOption] =
    useState<AddressAndPosition | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [options, setOptions] = useState<AddressAndPosition[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceSearchTerm = useDebounce(searchTerm, 400);
  const { cx } = useStyles();

  useEffect(
    () =>
      effectInitialSearchTerm(
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
      effectDebounceSearchTerm(
        debounceSearchTerm,
        initialSearchTerm,
        selectedOption,
        setOptions,
        setIsSearching,
      ),
    [debounceSearchTerm],
  );

  const noOptionText =
    isSearching || !debounceSearchTerm ? "..." : "Aucune adresse trouvée.";
  return (
    <div className={cx("fr-input-group")}>
      <Autocomplete
        loading={isSearching}
        loadingText="Recherche d'adresse en cours... 🔎"
        disablePortal
        noOptionsText={searchTerm ? noOptionText : "Saisissez une adresse."}
        options={options}
        value={selectedOption}
        id={id}
        getOptionLabel={(option) => addressDtoToString(option.address)}
        onChange={onAutocompleteChange(setSelectedOption, setFormValue)}
        onInputChange={onAutocompleteInput(setSearchTerm)}
        filterOptions={(option) => option} // https://mui.com/material-ui/react-autocomplete/#search-as-you-type
        renderInput={AutocompleteInput(
          headerClassName,
          label,
          inputStyle,
          disabled,
          placeholder,
          id,
        )}
      />
      {notice && (
        <span className={cx("im-autocomplete-input__notice")}>{notice}</span>
      )}
    </div>
  );
};

const onAutocompleteInput =
  (setSearchTerm: React.Dispatch<React.SetStateAction<string>>) =>
  (_: React.SyntheticEvent<Element, Event>, newSearchTerm: string) =>
    setSearchTerm(newSearchTerm);

const onAutocompleteChange =
  (
    setSelectedOption: React.Dispatch<
      React.SetStateAction<AddressAndPosition | null>
    >,
    setFormValue: (p: AddressAndPosition) => void,
  ) =>
  (
    _: React.SyntheticEvent<Element, Event>,
    selectedOption: AddressAndPosition | null,
  ) => {
    setSelectedOption(selectedOption ?? null);
    setFormValue(
      selectedOption
        ? selectedOption
        : {
            address: {
              streetNumberAndAddress: "",
              postcode: "",
              city: "",
              departmentCode: "",
            },
            position: { lat: 0, lon: 0 },
          },
    );
  };

const effectDebounceSearchTerm = (
  debounceSearchTerm: string,
  initialSearchTerm: string,
  selectedOption: AddressAndPosition | null,
  setOptions: React.Dispatch<React.SetStateAction<AddressAndPosition[]>>,
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>,
): void => {
  if (
    !debounceSearchTerm ||
    initialSearchTerm === debounceSearchTerm ||
    (selectedOption &&
      addressDtoToString(selectedOption.address) === debounceSearchTerm)
  )
    return;
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  getAddressesFromApi(debounceSearchTerm, setOptions, setIsSearching);
};

const effectInitialSearchTerm = (
  initialSearchTerm: string,
  selectedOption: AddressAndPosition | null,
  setOptions: React.Dispatch<React.SetStateAction<AddressAndPosition[]>>,
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>,
  setSelectedOption: React.Dispatch<
    React.SetStateAction<AddressAndPosition | null>
  >,
): void => {
  if (
    initialSearchTerm &&
    (!selectedOption ||
      initialSearchTerm !== addressDtoToString(selectedOption.address))
  )
    getAddressesFromApi(initialSearchTerm, setOptions, setIsSearching)
      .then((addresses) => setSelectedOption(addresses?.[0] ?? null))
      .catch((error: any) => {
        // eslint-disable-next-line no-console
        console.error("getAddressesFromApi", error);
      });
};
