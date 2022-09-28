import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConventionReadDto } from "shared";

export interface ConventionState {
  isLoading: boolean;
  convention: ConventionReadDto | null;
  error: string | null;
}

const initialState: ConventionState = {
  convention: null,
  isLoading: false,
  error: null,
};

export const conventionSlice = createSlice({
  name: "convention",
  initialState,
  reducers: {
    conventionRequested: (state, _action: PayloadAction<string>) => {
      state.isLoading = true;
    },
    conventionSucceeded: (
      state,
      action: PayloadAction<ConventionReadDto | undefined>,
    ) => {
      state.convention = action.payload ?? null;
      state.isLoading = false;
    },
    conventionFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});
