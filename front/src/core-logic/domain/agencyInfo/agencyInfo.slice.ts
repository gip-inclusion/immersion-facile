import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AgencyId, AgencyPublicDisplayDto } from "src/../../shared/src";
import { SubmitFeedBack } from "../SubmitFeedback";

export type AgencyInfoState = {
  agencyInfo: AgencyPublicDisplayDto | null;
  isLoading: boolean;
  feedback: SubmitFeedBack<"success">;
};
const initialState: AgencyInfoState = {
  agencyInfo: null,
  isLoading: false,
  feedback: { kind: "idle" },
};

export const agencyInfoSlice = createSlice({
  name: "agencyInfo",
  initialState,
  reducers: {
    fetchAgencyInfoRequested: (state, _action: PayloadAction<AgencyId>) => {
      state.isLoading = true;
    },
    fetchAgencyInfoSucceeded: (
      state,
      action: PayloadAction<AgencyPublicDisplayDto>,
    ) => {
      state.agencyInfo = action.payload;
      state.isLoading = false;
    },
    fetchAgencyInfoFailed: (state, action: PayloadAction<string>) => {
      state.feedback = { kind: "errored", errorMessage: action.payload };
      state.isLoading = false;
    },
  },
});
