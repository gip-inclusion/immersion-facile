import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";

export interface ImmersionConventionState {
  isLoading: boolean;
  convention: ImmersionApplicationDto | null;
  error: string | null;
}

const initialState: ImmersionConventionState = {
  convention: null,
  isLoading: false,
  error: null,
};

export const immersionConventionSlice = createSlice({
  name: "immersionConvention",
  initialState,
  reducers: {
    immersionConventionRequested: (state, _action: PayloadAction<string>) => {
      state.isLoading = true;
    },
    immersionConventionSucceeded: (
      state,
      action: PayloadAction<ImmersionApplicationDto | undefined>,
    ) => {
      state.convention = action.payload ?? null;
      state.isLoading = false;
    },
    immersionConventionFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});
