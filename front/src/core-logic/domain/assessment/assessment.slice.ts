import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AssessmentAndJwt } from "src/core-logic/ports/AssessmentGateway";

export type AssessmentUIStatus = "Idle" | "Loading" | "Success";

export interface AssessmentState {
  status: AssessmentUIStatus;
  error: string | null;
}

const initialState: AssessmentState = {
  status: "Idle",
  error: null,
};

export const assessmentSlice = createSlice({
  name: "assessment",
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
