import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { NafSectionSuggestion } from "shared";

export type NafState = {
  isLoading: boolean;
  isDebouncing: boolean;
  currentNafSections: NafSectionSuggestion[];
};

export const initialState: NafState = {
  isLoading: false,
  isDebouncing: false,
  currentNafSections: [],
};

export const nafSlice = createSlice({
  name: "naf",
  initialState,
  reducers: {
    queryHasChanged: (state, _action: PayloadAction<string>) => {
      state.currentNafSections = [];
      state.isDebouncing = true;
    },
    queryWasEmptied: (state) => {
      state.isLoading = false;
      state.currentNafSections = [];
    },
    searchSectionsRequested: (state, _action: PayloadAction<string>) => {
      state.isLoading = true;
      state.isDebouncing = false;
    },
    searchSectionsSucceeded: (
      state,
      action: PayloadAction<NafSectionSuggestion[]>,
    ) => {
      state.currentNafSections = action.payload;
      state.isLoading = false;
    },
    searchSectionsFailed: (state, _action) => {
      state.isLoading = false;
      state.currentNafSections = [];
    },
  },
});
