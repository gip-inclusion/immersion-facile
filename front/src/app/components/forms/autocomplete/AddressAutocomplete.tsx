import { useState } from "react";
import {
  RSAutocomplete,
  type RSAutocompleteComponentProps,
} from "react-design-system";
import { useDispatch } from "react-redux";
import { type AddressAndPosition, addressDtoToString } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { geocodingSelectors } from "src/core-logic/domain/geocoding/geocoding.selectors";
import {
  type AddressAutocompleteLocator,
  geocodingSlice,
} from "src/core-logic/domain/geocoding/geocoding.slice";

export type AddressAutocompleteProps = RSAutocompleteComponentProps<
  "address",
  AddressAndPosition,
  AddressAutocompleteLocator
>;

const useAddressAutocomplete = (locator: AddressAutocompleteLocator) => {
  const value = useAppSelector(geocodingSelectors.value);
  const options = useAppSelector(geocodingSelectors.suggestions).map(
    (suggestion) => ({
      value: suggestion,
      label: addressDtoToString(suggestion.address),
    }),
  );
  const isSearching = useAppSelector(geocodingSelectors.isLoading);
  const isDebouncing = useAppSelector(geocodingSelectors.isDebouncing);
  return {
    value: value?.[locator],
    options,
    isSearching,
    isDebouncing,
  };
};

export const AddressAutocomplete = ({
  onAddressClear,
  onAddressSelected,
  ...props
}: AddressAutocompleteProps) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { value, options, isSearching, isDebouncing } = useAddressAutocomplete(
    props.locator,
  );
  return (
    <RSAutocomplete
      {...props}
      selectProps={{
        isDebouncing,
        inputId: props.selectProps?.inputId ?? "im-select__input--place",
        isLoading: isSearching,
        loadingMessage: () => <>Recherche de d'adresse en cours... 🔎</>,
        inputValue: searchTerm,
        placeholder: "Ex : 123 Rue de la Paix 75001 Paris",
        value: value
          ? {
              label: addressDtoToString(value.address),
              value: value,
            }
          : undefined,
        onChange: (searchResult, actionMeta) => {
          if (
            actionMeta.action === "clear" ||
            actionMeta.action === "remove-value"
          ) {
            geocodingSlice.actions.queryWasEmptied();
            onAddressClear();
          }
          if (searchResult && actionMeta.action === "select-option") {
            onAddressSelected(searchResult.value);
            dispatch(
              geocodingSlice.actions.suggestionHasBeenSelected({
                addressAndPosition: searchResult.value,
                addressAutocompleteLocator: props.locator,
              }),
            );
            dispatch(geocodingSlice.actions.queryWasEmptied());
          }
        },
        options,
        onInputChange: (newQuery) => {
          setSearchTerm(newQuery);
          dispatch(
            geocodingSlice.actions.queryHasChanged({
              locator: props.locator,
              lookupAddress: newQuery,
            }),
          );
        },
      }}
    />
  );
};

// export const AddressAutocomplete = ({
//   label,
//   onAddressClear,
//   onAddressSelected,
//   initialValue,
//   initialInputValue,
//   disabled,
//   selectProps,
// }: AddressAutocompleteProps) => {
//   const dispatch = useDispatch();
//   const [searchTerm, setSearchTerm] = useState<string>(
//     initialInputValue ||
//       (initialValue ? addressDtoToString(initialValue.address) : ""),
//   );
//   const [hasBeenCleared, setHasBeenCleared] = useState(false);
//   const [selectedOption, setSelectedOption] = useState<
//     AddressAndPosition | undefined
//   >(initialValue);
//   const debounceSearchTerm = useDebounce(searchTerm);

//   const isSearching = useAppSelector(geocodingSelectors.isLoading);
//   const isDebouncing = useAppSelector(geocodingSelectors.isDebouncing);
//   const suggestions = useAppSelector(geocodingSelectors.suggestions);

//   useEffect(() => {
//     if (
//       initialValue &&
//       addressDtoToString(initialValue.address) &&
//       selectedOption === undefined &&
//       !hasBeenCleared
//     ) {
//       dispatch(
//         geocodingSlice.actions.queryHasChanged(
//           addressDtoToString(initialValue.address),
//         ),
//       );
//     }
//   }, [initialValue, selectedOption, dispatch, hasBeenCleared]);

//   useEffect(() => {
//     dispatch(geocodingSlice.actions.queryHasChanged(debounceSearchTerm));
//   }, [debounceSearchTerm, dispatch]);

//   const noOptionText = ({
//     isSearching,
//     isDebouncing,
//     searchTerm,
//   }: {
//     isSearching: boolean;
//     isDebouncing: boolean;
//     searchTerm: string;
//   }) => {
//     if (!searchTerm) return "Saisissez une adresse";
//     if (searchTerm.length < lookupStreetAddressQueryMinLength)
//       return `Saisissez au moins ${lookupStreetAddressQueryMinLength} caractères`;
//     if (isSearching || isDebouncing) return "...";
//     return "Aucune adresse trouvée";
//   };

//   return (
//     <RSAutocomplete
//       label={label}
//       disabled={disabled}
//       selectProps={{
//         ...selectProps,
//         isLoading: isSearching,
//         isDebouncing,
//         inputId: selectProps?.inputId ?? "im-select__input--address",
//         loadingMessage: () => <>Recherche d'adresse en cours... 🔎</>,
//         inputValue: searchTerm,
//         value: selectedOption
//           ? {
//               label: addressDtoToString(selectedOption.address),
//               value: selectedOption,
//             }
//           : undefined,
//         defaultValue: initialValue
//           ? {
//               label: addressDtoToString(initialValue.address),
//               value: initialValue,
//             }
//           : undefined,
//         noOptionsMessage: () =>
//           noOptionText({ isSearching, debounceSearchTerm, searchTerm }),
//         onChange: (searchResult, actionMeta) => {
//           if (
//             actionMeta.action === "clear" ||
//             actionMeta.action === "remove-value"
//           ) {
//             onAddressClear();
//             setSearchTerm("");
//             setHasBeenCleared(true);
//             setSelectedOption(undefined);
//             dispatch(geocodingSlice.actions.queryWasEmptied());
//           }
//           if (searchResult && actionMeta.action === "select-option") {
//             onAddressSelected(searchResult.value);
//             setSelectedOption(searchResult.value);
//             dispatch(
//               geocodingSlice.actions.suggestionHasBeenSelected(
//                 searchResult.value,
//               ),
//             );
//           }
//         },
//         onInputChange: (value) => {
//           setSearchTerm(value);
//         },
//         options: suggestions.map((option) => ({
//           value: option,
//           label: addressDtoToString(option.address),
//         })),
//         placeholder:
//           selectProps?.placeholder ?? "Ex : 123 Rue de la Paix 75001 Paris",
//       }}
//     />
//   );
// };

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
