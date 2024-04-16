import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { AgencyId, AgencyOption, AgencyPublicDisplayDto } from "shared";
import { SubmitFeedBack } from "../SubmitFeedback";

export type AgencySuccessFeedbackKind = "agencyAdded" | "success";

export type AgenciesState = {
  details: AgencyPublicDisplayDto | null;
  options: AgencyOption[];
  isLoading: boolean;
  feedback: SubmitFeedBack<AgencySuccessFeedbackKind>;
};

const initialState: AgenciesState = {
  details: null,
  options: [],
  isLoading: false,
  feedback: { kind: "idle" },
};

export const agenciesSlice = createSlice({
  name: "agencies",
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
    fetchAgenciesByDepartmentCodeRequested: (
      state,
      _action: PayloadAction<string>,
    ) => {
      state.isLoading = true;
    },
    fetchAgenciesByDepartmentCodeSucceeded: (
      state,
      action: PayloadAction<AgencyOption[]>,
    ) => {
      state.options = action.payload;
      state.feedback = { kind: "success" };
      state.isLoading = false;
    },
    fetchAgenciesByDepartmentCodeFailed: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.feedback = { kind: "errored", errorMessage: action.payload };
      state.isLoading = false;
    },
  },
});
