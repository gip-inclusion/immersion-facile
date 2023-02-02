import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LookupSearchResult } from "src/../../shared/src";
import { SubmitFeedBack } from "../SubmitFeedback";

type GeoSearchState = {
  feedback: SubmitFeedBack<"success">;
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
    queryHasChanged: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
      state.suggestions = [];
      state.value = null;
      state.isLoading = false;
    },
    suggestionsHaveBeenRequested: (state) => {
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
    suggestionHaveBeenSelected: () => {},
  },
});
