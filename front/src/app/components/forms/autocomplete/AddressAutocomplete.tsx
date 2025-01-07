import { fr } from "@codegouvfr/react-dsfr";
import Autocomplete from "@mui/material/Autocomplete";
import React, { useEffect, useState } from "react";
import { AutocompleteInput, AutocompleteInputProps } from "react-design-system";
import { AddressAndPosition, addressDtoToString } from "shared";
import { useDebounce } from "src/app/hooks/useDebounce";
import { useStyles } from "tss-react/dsfr";
import { getAddressesFromApi } from "./getAddressesFromApi";

export type AddressAutocompleteProps = {
  label: string;
  initialSearchTerm?: string;
  disabled?: boolean;
  headerClassName?: string;
  inputStyle?: React.CSSProperties;
  setFormValue: (p: AddressAndPosition) => void;
  placeholder?: string;
  hintText?: React.ReactNode;
  notice?: string;
  id?: string;
  useFirstAddressOnInitialSearchTerm?: boolean;
  state?: AutocompleteInputProps["state"];
  stateRelatedMessage?: AutocompleteInputProps["stateRelatedMessage"];
};

export const AddressAutocomplete = ({
  label,
  setFormValue,
  disabled,
  headerClassName,
  inputStyle,
  initialSearchTerm = "",
  placeholder,
  hintText,
  notice,
  id = "im-address-autocomplete",
  useFirstAddressOnInitialSearchTerm,
  state,
  stateRelatedMessage,
}: AddressAutocompleteProps) => {
  const [selectedOption, setSelectedOption] =
    useState<AddressAndPosition | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [options, setOptions] = useState<AddressAndPosition[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceSearchTerm = useDebounce(searchTerm);
  const { cx } = useStyles();

  useEffect(
    () =>
      effectInitialSearchTerm({
        initialSearchTerm,
        selectedOption,
        setOptions,
        setIsSearching,
        setSelectedOption,
        setFormValue,
        shouldSetFirstAddressInForm: useFirstAddressOnInitialSearchTerm,
      }),
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

  const noOptionText = ({
    isSearching,
    debounceSearchTerm,
    searchTerm,
  }: {
    isSearching: boolean;
    debounceSearchTerm: string;
    searchTerm: string;
  }) => {
    if (!searchTerm) return "Saisissez une adresse";
    if (searchTerm.length < 3) return "Saisissez au moins 3 caractères";
    if (isSearching || searchTerm !== debounceSearchTerm) return "...";
    return "Aucune adresse trouvée";
  };
  return (
    <div className={fr.cx("fr-input-group")}>
      <Autocomplete
        loading={isSearching}
        loadingText="Recherche d'adresse en cours... 🔎"
        disablePortal
        noOptionsText={
          searchTerm
            ? noOptionText({
                isSearching,
                debounceSearchTerm,
                searchTerm,
              })
            : "Saisissez une adresse."
        }
        options={options}
        value={selectedOption}
        id={id}
        getOptionLabel={(option) => {
          // add empty string to return because mui autocomplete return type must be string
          if (!option.address) return "";
          return addressDtoToString(option.address);
        }}
        onChange={onAutocompleteChange(setSelectedOption, setFormValue)}
        onInputChange={(_event, value) => {
          if (value === "") {
            setOptions([]);
            setIsSearching(false);
          }
          setSearchTerm(value);
        }}
        filterOptions={(option) => option} // https://mui.com/material-ui/react-autocomplete/#search-as-you-type
        renderInput={(params) => (
          <AutocompleteInput
            headerClassName={headerClassName}
            label={label}
            inputStyle={inputStyle}
            disabled={disabled}
            placeholder={placeholder}
            id={id}
            hintText={hintText}
            params={params}
            state={state}
            stateRelatedMessage={stateRelatedMessage}
          />
        )}
      />
      {notice && (
        <span className={cx("im-autocomplete-input__notice")}>{notice}</span>
      )}
    </div>
  );
};

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
  ) {
    return;
  }

  getAddressesFromApi(debounceSearchTerm, setOptions, setIsSearching);
};

type EffectInitialSearchTermProps = {
  initialSearchTerm: string;
  selectedOption: AddressAndPosition | null;
  setOptions: React.Dispatch<React.SetStateAction<AddressAndPosition[]>>;
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedOption: React.Dispatch<
    React.SetStateAction<AddressAndPosition | null>
  >;
  setFormValue: (p: AddressAndPosition) => void;
  shouldSetFirstAddressInForm?: boolean;
};

const effectInitialSearchTerm = ({
  initialSearchTerm,
  selectedOption,
  setOptions,
  setIsSearching,
  setSelectedOption,
  setFormValue,
  shouldSetFirstAddressInForm,
}: EffectInitialSearchTermProps): void => {
  if (
    initialSearchTerm &&
    (!selectedOption ||
      initialSearchTerm !== addressDtoToString(selectedOption.address))
  )
    getAddressesFromApi(initialSearchTerm, setOptions, setIsSearching)
      .then((addresses) => {
        const firstAddress: AddressAndPosition | undefined = addresses?.[0];
        setSelectedOption(firstAddress ?? null);
        if (shouldSetFirstAddressInForm && firstAddress)
          setFormValue(firstAddress);
      })
      .catch((error: any) => {
        console.error("getAddressesFromApi", error);
      });
};
