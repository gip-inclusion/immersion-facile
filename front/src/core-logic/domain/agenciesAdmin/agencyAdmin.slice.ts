import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AgencyDto, AgencyId, AgencyOption } from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";

export type AgencySuccessFeedbackKind = "agencyAdded" | "agencyUpdated";
export type AgencySubmitFeedback = SubmitFeedBack<AgencySuccessFeedbackKind>;

export interface AgencyAdminState {
  agencySearchText: string;
  agencyOptions: AgencyOption[];
  selectedAgencyId: AgencyId | null;
  agency: AgencyDto | null;
  isSearching: boolean;
  isUpdating: boolean;
  error: string | null;
  feedback: AgencySubmitFeedback;
}

export const agencyAdminInitialState: AgencyAdminState = {
  agencySearchText: "",
  agencyOptions: [],
  selectedAgencyId: null,
  agency: null,
  isSearching: false,
  isUpdating: false,
  feedback: { kind: "idle" },
  error: null,
};

export const agencyAdminSlice = createSlice({
  name: "agencyAdmin",
  initialState: agencyAdminInitialState,
  reducers: {
    setAgencySearchText: (state, action: PayloadAction<string>) => {
      state.agencySearchText = action.payload;
      state.isSearching = true;
    },
    setAgencyOptions: (state, action: PayloadAction<AgencyOption[]>) => {
      state.agencyOptions = action.payload;
      state.isSearching = false;
    },
    setSelectedAgencyId: (state, action: PayloadAction<AgencyId>) => {
      state.selectedAgencyId = action.payload;
      state.feedback = { kind: "idle" };
      state.agency = null;
    },
    setAgency: (state, action: PayloadAction<AgencyDto | null>) => {
      state.agency = action.payload ?? null;
    },
    updateAgencyRequested: (state, _action: PayloadAction<AgencyDto>) => {
      state.isUpdating = true;
      state.feedback = { kind: "idle" };
    },
    updateAgencySucceeded: (state) => {
      state.isUpdating = false;
      state.feedback = { kind: "agencyUpdated" };
    },
    updateAgencyFailed: (state, action: PayloadAction<string>) => {
      state.isUpdating = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
  },
});
