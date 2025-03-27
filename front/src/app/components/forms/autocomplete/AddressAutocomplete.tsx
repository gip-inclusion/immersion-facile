import { useEffect, useState } from "react";
import {
  RSAutocomplete,
  type RSAutocompleteComponentProps,
} from "react-design-system";
import {
  type AddressAndPosition,
  addressDtoToString,
  lookupStreetAddressQueryMinLength,
} from "shared";
import { useDebounce } from "src/app/hooks/useDebounce";
import { outOfReduxDependencies } from "src/config/dependencies";
import type { AddressGateway } from "src/core-logic/ports/AddressGateway";

export type AddressAutocompleteProps = RSAutocompleteComponentProps<
  "address",
  AddressAndPosition
> & {
  useNaturalLanguage?: boolean;
  initialValue?: AddressAndPosition;
  onAddressSelected: (address: AddressAndPosition) => void;
  onAddressClear: () => void;
  initialInputValue?: string;
};

const lookupAddresses = async (
  searchTerm: string,
  addressGateway: AddressGateway,
  lookupStreetAddressQueryMinLength: number,
): Promise<AddressAndPosition[]> => {
  const sanitizedTerm = searchTerm.trim();
  if (
    !sanitizedTerm ||
    sanitizedTerm.length < lookupStreetAddressQueryMinLength
  ) {
    return [];
  }
  try {
    return await addressGateway.lookupStreetAddress(sanitizedTerm);
  } catch (e: any) {
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log("AddressAutocomplete", e);
    return [];
  }
};

export const AddressAutocomplete = ({
  label,
  onAddressClear,
  onAddressSelected,
  initialValue,
  initialInputValue,
  disabled,
  selectProps,
}: AddressAutocompleteProps) => {
  const [searchTerm, setSearchTerm] = useState<string>(
    initialInputValue ||
      (initialValue ? addressDtoToString(initialValue.address) : ""),
  );
  const [options, setOptions] = useState<AddressAndPosition[]>([]);
  const [selectedOption, setSelectedOption] = useState<
    AddressAndPosition | undefined
  >(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const debounceSearchTerm = useDebounce(searchTerm);

  useEffect(() => {
    if (
      initialValue &&
      addressDtoToString(initialValue.address) &&
      selectedOption === undefined
    ) {
      (async () => {
        setIsSearching(true);
        const addresses = await lookupAddresses(
          addressDtoToString(initialValue.address),
          outOfReduxDependencies.addressGateway,
          lookupStreetAddressQueryMinLength,
        );
        setOptions(addresses);
        setSelectedOption(addresses[0]);
        onAddressSelected(addresses[0]);
        setIsSearching(false);
      })();
    }
  }, [initialValue, selectedOption, onAddressSelected]);

  useEffect(() => {
    (async () => {
      setIsSearching(true);
      const addresses = await lookupAddresses(
        debounceSearchTerm,
        outOfReduxDependencies.addressGateway,
        lookupStreetAddressQueryMinLength,
      );
      setOptions(addresses);
    })();
  }, [debounceSearchTerm]);

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
    <RSAutocomplete
      label={label}
      disabled={disabled}
      selectProps={{
        ...selectProps,
        isLoading: isSearching,
        inputId: selectProps?.inputId ?? "im-select__input--address",
        loadingMessage: () => <>Recherche d'adresse en cours... 🔎</>,
        inputValue: searchTerm,
        value: selectedOption
          ? {
              label: addressDtoToString(selectedOption.address),
              value: selectedOption,
            }
          : undefined,
        defaultValue: initialValue
          ? {
              label: addressDtoToString(initialValue.address),
              value: initialValue,
            }
          : undefined,
        noOptionsMessage: () =>
          noOptionText({ isSearching, debounceSearchTerm, searchTerm }),
        onChange: (searchResult, actionMeta) => {
          if (
            actionMeta.action === "clear" ||
            actionMeta.action === "remove-value"
          ) {
            onAddressClear();
            setSelectedOption(undefined);
          }
          if (searchResult && actionMeta.action === "select-option") {
            onAddressSelected(searchResult.value);
            setSelectedOption(searchResult.value);
          }
        },
        onInputChange: (value) => {
          setSearchTerm(value);
        },
        options: options.map((option) => ({
          value: option,
          label: addressDtoToString(option.address),
        })),
        placeholder:
          selectProps?.placeholder ?? "Ex : 123 Rue de la Paix 75001 Paris",
      }}
    />
  );
};

export const addressStringToFakeAddressAndPosition = (
  address: string,
): AddressAndPosition => ({
  address: {
    streetNumberAndAddress: address,
    postcode: "",
    departmentCode: "",
    city: "",
  },
  position: { lat: 0, lon: 0 },
});
