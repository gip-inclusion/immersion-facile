import { createSlice } from "@reduxjs/toolkit";
import type { LookupLocationInput, LookupSearchResult } from "shared";
import {
  type AutocompleteState,
  type PayloadActionWithLocator,
  initialAutocompleteItem,
} from "src/core-logic/domain/autocomplete.utils";

export type GeosearchLocator = "search-form-place";

const initialState: AutocompleteState<GeosearchLocator, LookupSearchResult> = {
  data: {},
};

export const geosearchSlice = createSlice({
  name: "geosearch",
  initialState,
  reducers: {
    emptyQueryRequested: (
      _state,
      action: PayloadActionWithLocator<GeosearchLocator>,
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
        GeosearchLocator,
        {
          lookup: LookupLocationInput;
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
        GeosearchLocator,
        {
          lookup: LookupLocationInput;
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
        GeosearchLocator,
        {
          suggestions: LookupSearchResult[];
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
          },
        },
      };
    },
    fetchSuggestionsFailed: (
      state,
      action: PayloadActionWithLocator<GeosearchLocator>,
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
        GeosearchLocator,
        { item: LookupSearchResult }
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
});
