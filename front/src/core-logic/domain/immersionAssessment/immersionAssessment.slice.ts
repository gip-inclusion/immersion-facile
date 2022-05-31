import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ImmersionAssessmentDto } from "src/../../shared/src/immersionAssessment/ImmersionAssessmentDto";

export interface ImmersionAssessmentState {
  isLoading: boolean;
  error: string | null;
}

const initialState: ImmersionAssessmentState = {
  isLoading: false,
  error: null,
};

export const immersionAssessmentSlice = createSlice({
  name: "immersionAssessment",
  initialState,
  reducers: {
    creationRequested: (
      state,
      _action: PayloadAction<ImmersionAssessmentDto>,
    ) => {
      state.isLoading = true;
    },
    creationSucceeded: (state) => {
      state.isLoading = false;
    },
    creationFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});
