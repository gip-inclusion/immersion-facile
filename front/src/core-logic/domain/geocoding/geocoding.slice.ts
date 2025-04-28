import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { AddressAndPosition, LookupAddress } from "shared";

type MultipleAddressAutocompleteLocator = `multipleAddress-${number}`;

export type AddressAutocompleteLocator =
  | "conventionImmersionAddress"
  | "conventionBeneficiaryAddress"
  | "conventionBeneficiaryCurrentEmployerAddress"
  | "agencyAddress"
  | "createEstablishmentAddress"
  | MultipleAddressAutocompleteLocator;

type GeocodingState = {
  suggestions: AddressAndPosition[];
  values: Partial<
    Record<AddressAutocompleteLocator, AddressAndPosition>
  > | null;
  query: string;
  isLoading: boolean;
  isDebouncing: boolean;
};

const initialState: GeocodingState = {
  suggestions: [],
  query: "",
  values: null,
  isLoading: false,
  isDebouncing: false,
};

type PayloadActionWithLocator<Payload> = PayloadAction<
  Payload & { locator: AddressAutocompleteLocator }
>;

export const geocodingSlice = createSlice({
  name: "geocoding",
  initialState,
  reducers: {
    queryWasEmptied: (_state) => initialState,
    queryHasChanged: (
      state,
      _action: PayloadActionWithLocator<{ lookupAddress: LookupAddress }>,
    ) => {
      state.suggestions = [];
      state.isDebouncing = true;
    },
    suggestionsHaveBeenRequested: (
      state,
      action: PayloadActionWithLocator<{
        lookupAddress: LookupAddress;
        selectFirstSuggestion: boolean;
      }>,
    ) => {
      state.query = action.payload.lookupAddress;
      state.isLoading = true;
      state.isDebouncing = false;
    },
    suggestionsSuccessfullyFetched: (
      state,
      action: PayloadActionWithLocator<{
        suggestions: AddressAndPosition[];
        selectFirstSuggestion: boolean;
      }>,
    ) => {
      state.suggestions = action.payload.suggestions;
      state.isLoading = false;
      if (action.payload.selectFirstSuggestion) {
        state.values = {
          ...state.values,
          [action.payload.locator]: action.payload.suggestions[0],
        };
      }
    },
    suggestionsFailed: (state, _action) => {
      state.isLoading = false;
    },
    suggestionHasBeenSelected: (
      state,
      action: PayloadAction<{
        addressAndPosition: AddressAndPosition;
        addressAutocompleteLocator: AddressAutocompleteLocator;
      }>,
    ) => {
      state.values = {
        ...state.values,
        [action.payload.addressAutocompleteLocator]:
          action.payload.addressAndPosition,
      };
    },
  },
});
