import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { AgencyDto, AgencyId } from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";
import { NormalizedIcUserById } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";

export type AgencyDashboardSuccessFeedbackKind =
  | "agencyUpdated"
  | "agencyUsersFetchSuccess"
  | "agencyFetchSuccess";

export type AgencyDashboardSubmitFeedback =
  SubmitFeedBack<AgencyDashboardSuccessFeedbackKind>;

export interface AgencyDashboardState {
  agency: AgencyDto | null;
  agencyUsers: NormalizedIcUserById;
  isFetchingAgencyUsers: boolean;
  isFetchingAgency: boolean;
  isUpdating: boolean;
  error: string | null;
  feedback: AgencyDashboardSubmitFeedback;
}

export const agencyDashboardInitialState: AgencyDashboardState = {
  agency: null,
  agencyUsers: {},
  isFetchingAgencyUsers: false,
  isFetchingAgency: false,
  isUpdating: false,
  feedback: { kind: "idle" },
  error: null,
};

export const agencyDashboardSlice = createSlice({
  name: "agencyDashboard",
  initialState: agencyDashboardInitialState,
  reducers: {
    fetchAgencyRequested: (state, _action: PayloadAction<AgencyId>) => {
      state.feedback = { kind: "idle" };
      state.agency = null;
    },

    fetchAgencySucceeded: (state, action: PayloadAction<AgencyDto>) => {
      state.isFetchingAgency = false;
      state.agency = action.payload;
      state.feedback.kind = "agencyFetchSuccess";
    },

    fetchAgencyFailed: (state, action: PayloadAction<string>) => {
      state.isFetchingAgency = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },

    fetchAgencyUsersRequested: (state, _action: PayloadAction<AgencyId>) => {
      state.isFetchingAgencyUsers = true;
    },

    fetchAgencyUsersSucceeded: (
      state,
      action: PayloadAction<NormalizedIcUserById>,
    ) => {
      state.isFetchingAgencyUsers = false;
      state.agencyUsers = action.payload;
      state.feedback.kind = "agencyUsersFetchSuccess";
    },
    fetchAgencyUsersFailed: (state, action: PayloadAction<string>) => {
      state.isFetchingAgencyUsers = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },

    // updateAgencyRequested: (state, _action: PayloadAction<AgencyDto>) => {
    //   state.isUpdating = true;
    //   state.feedback = { kind: "idle" };
    // },
    // updateAgencySucceeded: (state, _action: PayloadAction<AgencyDto>) => {
    //   state.isUpdating = false;
    //   state.feedback = { kind: "agencyUpdated" };
    // },

    // updateAgencyFailed: (state, action: PayloadAction<string>) => {
    //   state.isUpdating = false;
    //   state.feedback = { kind: "errored", errorMessage: action.payload };
    // },

    clearAgencyAndUsers: (state) => {
      state.agency = null;
      state.agencyUsers = {};
      state.feedback = { kind: "idle" };
    },
  },
});
