import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { AppellationMatchDto } from "shared";

export type AppellationAutocompleteLocator =
  | "searchAppellation"
  | "conventionProfession"
  | `multipleAppellation-${number}`;

type AppellationState = {
  suggestions: AppellationMatchDto[];
  values: Partial<
    Record<AppellationAutocompleteLocator, AppellationMatchDto>
  > | null;
  query: string;
  isLoading: boolean;
  isDebouncing: boolean;
};

const initialState: AppellationState = {
  suggestions: [],
  query: "",
  values: null,
  isLoading: false,
  isDebouncing: false,
};

type PayloadActionWithLocator<Payload> = PayloadAction<
  Payload & { locator: AppellationAutocompleteLocator }
>;

export const appellationSlice = createSlice({
  name: "appellation",
  initialState,
  reducers: {
    queryWasEmptied: (_state) => initialState,
    queryHasChanged: (
      state,
      _action: PayloadActionWithLocator<{ lookupAppellation: string }>,
    ) => {
      state.suggestions = [];
      state.isDebouncing = true;
    },
    suggestionsHaveBeenRequested: (
      state,
      action: PayloadActionWithLocator<{
        lookupAppellation: string;
      }>,
    ) => {
      state.query = action.payload.lookupAppellation;
      state.isLoading = true;
      state.isDebouncing = false;
    },
    suggestionsSuccessfullyFetched: (
      state,
      action: PayloadActionWithLocator<{
        suggestions: AppellationMatchDto[];
      }>,
    ) => {
      state.suggestions = action.payload.suggestions;
      state.isLoading = false;
    },
    suggestionsFailed: (state, _action) => {
      state.isLoading = false;
    },
    suggestionHasBeenSelected: (
      state,
      action: PayloadAction<{
        appellationMatch: AppellationMatchDto;
        appellationAutocompleteLocator: AppellationAutocompleteLocator;
      }>,
    ) => {
      state.values = {
        ...state.values,
        [action.payload.appellationAutocompleteLocator]:
          action.payload.appellationMatch,
      };
    },
  },
});
