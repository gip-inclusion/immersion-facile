import { fr } from "@codegouvfr/react-dsfr";
import React, { useEffect, useMemo, useState } from "react";
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

export const AddressAutocomplete = ({
  label,
  onAddressClear,
  onAddressSelected,
  initialValue,
  initialInputValue,
  disabled,
  selectProps,
}: AddressAutocompleteProps) => {
  const initialOption = useMemo(() => initialValue ?? null, [initialValue]);
  const [searchTerm, setSearchTerm] = useState<string>(
    initialInputValue ||
      (initialOption ? addressDtoToString(initialOption.address) : ""),
  );
  const [options, setOptions] = useState<AddressAndPosition[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceSearchTerm = useDebounce(searchTerm);

  useEffect(() => {
    (async () => {
      const sanitizedTerm = debounceSearchTerm.trim();
      if (
        !sanitizedTerm ||
        sanitizedTerm.length < lookupStreetAddressQueryMinLength
      ) {
        setOptions([]);
        return [];
      }
      try {
        setIsSearching(true);
        const addresses =
          await outOfReduxDependencies.addressGateway.lookupStreetAddress(
            sanitizedTerm,
          );
        setOptions(addresses);
      } catch (e: any) {
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log("AddressAutocomplete", e);
      } finally {
        setIsSearching(false);
      }
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
    <div className={fr.cx("fr-input-group")}>
      <RSAutocomplete
        label={label}
        disabled={disabled}
        selectProps={{
          ...selectProps,
          isLoading: isSearching,
          inputId: selectProps?.inputId ?? "im-select__input--address",
          loadingMessage: () => <>Recherche d'adresse en cours... 🔎</>,
          inputValue: searchTerm,
          defaultValue: initialOption
            ? {
                label: addressDtoToString(initialOption.address),
                value: initialOption,
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
            }
            if (searchResult && actionMeta.action === "select-option") {
              onAddressSelected(searchResult.value);
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
    </div>
  );
};
