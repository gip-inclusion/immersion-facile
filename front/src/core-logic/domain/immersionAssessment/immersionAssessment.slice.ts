import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AssessmentAndJwt } from "src/core-logic/ports/ImmersionAssessmentGateway";

export type ImmersionAssessmentUIStatus = "Idle" | "Loading" | "Success";

export interface ImmersionAssessmentState {
  status: ImmersionAssessmentUIStatus;
  error: string | null;
}

const initialState: ImmersionAssessmentState = {
  status: "Idle",
  error: null,
};

export const immersionAssessmentSlice = createSlice({
  name: "immersionAssessment",
  initialState,
  reducers: {
    creationRequested: (state, _action: PayloadAction<AssessmentAndJwt>) => {
      state.status = "Loading";
    },
    creationSucceeded: (state) => {
      state.status = "Success";
    },
    creationFailed: (state, action: PayloadAction<string>) => {
      state.status = "Idle";
      state.error = action.payload;
    },
  },
});
