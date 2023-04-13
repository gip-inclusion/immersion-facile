import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AgencyId, AgencyPublicDisplayDto } from "shared";
import { SubmitFeedBack } from "../SubmitFeedback";

export type AgencyInfoState = {
  details: AgencyPublicDisplayDto | null;
  isLoading: boolean;
  feedback: SubmitFeedBack<"success">;
};
const initialState: AgencyInfoState = {
  details: null,
  isLoading: false,
  feedback: { kind: "idle" },
};

export const agencyInfoSlice = createSlice({
  name: "agencyInfo",
  initialState,
  reducers: {
    fetchAgencyInfoRequested: (state, _action: PayloadAction<AgencyId>) => {
      state.isLoading = true;
      state.details = null;
    },
    fetchAgencyInfoSucceeded: (
      state,
      action: PayloadAction<AgencyPublicDisplayDto>,
    ) => {
      state.details = action.payload;
      state.isLoading = false;
      state.feedback = { kind: "success" };
    },
    fetchAgencyInfoFailed: (state, action: PayloadAction<string>) => {
      state.feedback = { kind: "errored", errorMessage: action.payload };
      state.isLoading = false;
    },
  },
});
