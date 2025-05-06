import { createSlice } from "@reduxjs/toolkit";
import type { AddressAndPosition, LookupAddress } from "shared";
import { agencyAdminSlice } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import {
  type AutocompleteState,
  type PayloadActionWithLocator,
  initialAutocompleteItem,
} from "src/core-logic/domain/autocomplete.utils";

type MultipleAddressAutocompleteLocator = `multiple-address-${number}`;

export type AddressAutocompleteLocator =
  | "convention-immersion-address"
  | "convention-beneficiary-address"
  | "convention-beneficiary-current-employer-address"
  | "agency-address"
  | "create-establishment-address"
  | MultipleAddressAutocompleteLocator;

const initialState: AutocompleteState<
  AddressAutocompleteLocator,
  AddressAndPosition
> = {
  data: {},
};

export const geocodingSlice = createSlice({
  name: "geocoding",
  initialState,
  reducers: {
    emptyQueryRequested: (
      _state,
      action: PayloadActionWithLocator<AddressAutocompleteLocator>,
    ) => ({
      ...initialState,
      data: {
        ...initialState.data,
        [action.payload.locator]: {
          ...initialAutocompleteItem,
        },
      },
    }),
    changeQueryRequested: (
      state,
      action: PayloadActionWithLocator<
        AddressAutocompleteLocator,
        {
          lookup: LookupAddress;
        }
      >,
    ) => {
      const { locator } = action.payload;
      state.data[locator] = {
        ...initialAutocompleteItem,
        isDebouncing: true,
      };
    },
    fetchSuggestionsRequested: (
      state,
      action: PayloadActionWithLocator<
        AddressAutocompleteLocator,
        {
          lookup: LookupAddress;
          selectFirstSuggestion: boolean;
        }
      >,
    ) => {
      const { locator } = action.payload;
      return {
        ...state,
        data: {
          ...state.data,
          [locator]: {
            ...initialAutocompleteItem,
            ...state.data[locator],
            query: action.payload.lookup,
            isLoading: true,
            isDebouncing: false,
          },
        },
      };
    },
    fetchSuggestionsSucceeded: (
      state,
      action: PayloadActionWithLocator<
        AddressAutocompleteLocator,
        {
          suggestions: AddressAndPosition[];
          selectFirstSuggestion: boolean;
        }
      >,
    ) => {
      const { locator } = action.payload;
      return {
        ...state,
        data: {
          ...state.data,
          [locator]: {
            ...initialAutocompleteItem,
            ...state.data[locator],
            isLoading: false,
            suggestions: action.payload.suggestions,
            value: action.payload.selectFirstSuggestion
              ? action.payload.suggestions[0]
              : null,
          },
        },
      };
    },
    fetchSuggestionsFailed: (
      state,
      action: PayloadActionWithLocator<AddressAutocompleteLocator>,
    ) => {
      const { locator } = action.payload;
      return {
        ...state,
        data: {
          ...state.data,
          [locator]: {
            ...initialAutocompleteItem,
            ...state.data[locator],
            isLoading: false,
          },
        },
      };
    },
    selectSuggestionRequested: (
      state,
      action: PayloadActionWithLocator<
        AddressAutocompleteLocator,
        { item: AddressAndPosition }
      >,
    ) => {
      const { locator } = action.payload;
      return {
        ...state,
        data: {
          ...state.data,
          [locator]: {
            ...initialAutocompleteItem,
            ...state.data[locator],
            value: action.payload.item,
          },
        },
      };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(agencyAdminSlice.actions.setAgency, (state, action) => {
      if (!action.payload) return;
      state.data["agency-address"] = {
        ...initialAutocompleteItem,
        value: {
          address: action.payload.address,
          position: {
            lat: action.payload.position.lat,
            lon: action.payload.position.lon,
          },
        },
      };
    });
  },
});
