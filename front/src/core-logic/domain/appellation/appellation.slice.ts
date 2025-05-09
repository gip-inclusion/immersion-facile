import { createSlice } from "@reduxjs/toolkit";
import type { AppellationMatchDto } from "shared";
import {
  type AutocompleteState,
  type PayloadActionWithLocator,
  initialAutocompleteItem,
} from "src/core-logic/domain/autocomplete.utils";

export type AppellationAutocompleteLocator =
  | "search-form-appellation"
  | "convention-profession"
  | `multiple-appellation-${number}`;

const initialState: AutocompleteState<
  AppellationAutocompleteLocator,
  AppellationMatchDto
> = {
  data: {},
};

export const appellationSlice = createSlice({
  name: "appellation",
  initialState,
  reducers: {
    clearLocatorDataRequested: (
      state,
      action: PayloadActionWithLocator<AppellationAutocompleteLocator>,
    ) => ({
      ...initialState,
      data: {
        ...state.data,
        [action.payload.locator]: initialAutocompleteItem,
      },
    }),
    emptyQueryRequested: (
      state,
      action: PayloadActionWithLocator<AppellationAutocompleteLocator>,
    ) => ({
      ...initialState,
      data: {
        ...state.data,
        [action.payload.locator]: {
          ...initialAutocompleteItem,
          ...state.data[action.payload.locator],
          query: "",
        },
      },
    }),
    changeQueryRequested: (
      state,
      action: PayloadActionWithLocator<
        AppellationAutocompleteLocator,
        { lookup: string }
      >,
    ) => {
      const { locator } = action.payload;
      state.data[locator] = {
        ...initialAutocompleteItem,
        ...state.data[locator],
        isDebouncing: true,
      };
    },
    fetchSuggestionsRequested: (
      state,
      action: PayloadActionWithLocator<
        AppellationAutocompleteLocator,
        { lookup: string }
      >,
    ) => {
      const { locator } = action.payload;
      state.data[locator] = {
        ...initialAutocompleteItem,
        ...state.data[locator],
        query: action.payload.lookup,
        isLoading: true,
        isDebouncing: false,
      };
    },
    fetchSuggestionsSucceeded: (
      state,
      action: PayloadActionWithLocator<
        AppellationAutocompleteLocator,
        {
          suggestions: AppellationMatchDto[];
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
      action: PayloadActionWithLocator<AppellationAutocompleteLocator>,
    ) => {
      const { locator } = action.payload;
      return {
        ...state,
        data: {
          ...state.data,
          [locator]: {
            ...state.data[locator],
            isLoading: false,
          },
        },
      };
    },
    selectSuggestionRequested: (
      state,
      action: PayloadActionWithLocator<
        AppellationAutocompleteLocator,
        {
          item: AppellationMatchDto;
        }
      >,
    ) => {
      const { locator } = action.payload;
      return {
        ...state,
        data: {
          ...state.data,
          [locator]: {
            ...state.data[locator],
            value: action.payload.item,
          },
        },
      };
    },
  },
});
