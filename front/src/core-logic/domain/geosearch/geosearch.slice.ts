import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { LookupLocationInput, LookupSearchResult } from "shared";
import { SubmitFeedBack } from "../SubmitFeedback";

export type GeoSearchFeedback = SubmitFeedBack<"success">;

type GeoSearchState = {
  feedback: GeoSearchFeedback;
  suggestions: LookupSearchResult[];
  value: LookupSearchResult | null;
  query: string;
  isLoading: boolean;
};

const initialState: GeoSearchState = {
  suggestions: [],
  query: "",
  value: null,
  isLoading: false,
  feedback: {
    kind: "idle",
  },
};

export const geosearchSlice = createSlice({
  name: "geosearch",
  initialState,
  reducers: {
    queryWasEmptied: (state) => {
      state.value = null;
    },
    queryHasChanged: (state, _action: PayloadAction<LookupLocationInput>) => {
      state.suggestions = [];
    },
    suggestionsHaveBeenRequested: (
      state,
      action: PayloadAction<LookupLocationInput>,
    ) => {
      state.query = action.payload;
      state.isLoading = true;
    },
    suggestionsSuccessfullyFetched: (
      state,
      action: PayloadAction<LookupSearchResult[]>,
    ) => {
      state.suggestions = action.payload;
      state.isLoading = false;
    },
    suggestionsFailed: (state, action) => {
      state.isLoading = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    suggestionHasBeenSelected: (state, action) => {
      state.value = action.payload;
    },
  },
});
