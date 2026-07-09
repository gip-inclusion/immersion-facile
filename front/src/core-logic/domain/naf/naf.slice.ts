import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { NafSectionSuggestion } from "shared";

export type NafState = {
  isLoading: boolean;
  allSections: NafSectionSuggestion[];
};

export const initialState: NafState = {
  isLoading: false,
  allSections: [],
};

export const nafSlice = createSlice({
  name: "naf",
  initialState,
  reducers: {
    getAllSectionsRequested: (state) => {
      state.isLoading = true;
    },
    getAllSectionsSucceeded: (
      state,
      action: PayloadAction<NafSectionSuggestion[]>,
    ) => {
      state.allSections = action.payload;
      state.isLoading = false;
    },
    getAllSectionsFailed: (state, _action: PayloadAction<null>) => {
      state.isLoading = false;
      state.allSections = [];
    },
  },
});
