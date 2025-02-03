import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { LookupLocationInput, LookupSearchResult } from "shared";

type GeoSearchState = {
  suggestions: LookupSearchResult[];
  value: LookupSearchResult | null;
  query: string;
  isLoading: boolean;
  isDebouncing: boolean;
};

const initialState: GeoSearchState = {
  suggestions: [],
  query: "",
  value: null,
  isLoading: false,
  isDebouncing: false,
};

export const geosearchSlice = createSlice({
  name: "geosearch",
  initialState,
  reducers: {
    queryWasEmptied: (_state) => initialState,
    queryHasChanged: (state, _action: PayloadAction<LookupLocationInput>) => {
      state.suggestions = [];
      state.isDebouncing = true;
    },
    suggestionsHaveBeenRequested: (
      state,
      action: PayloadAction<LookupLocationInput>,
    ) => {
      state.query = action.payload;
      state.isLoading = true;
      state.isDebouncing = false;
    },
    suggestionsSuccessfullyFetched: (
      state,
      action: PayloadAction<LookupSearchResult[]>,
    ) => {
      state.suggestions = action.payload;
      state.isLoading = false;
    },
    suggestionsFailed: (state, _action) => {
      state.isLoading = false;
    },
    suggestionHasBeenSelected: (state, action) => {
      state.value = action.payload;
    },
  },
});
