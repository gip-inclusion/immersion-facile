import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  ListAgencyOptionsRequestDto,
} from "shared";
import { SubmitFeedBack } from "../SubmitFeedback";

export type AgenciesFeedbackKind =
  | "agencyAdded"
  | "agencyOfTypeOtherAdded"
  | "success";

export type AgenciesSubmitFeedback = SubmitFeedBack<AgenciesFeedbackKind>;

export type AgenciesState = {
  details: AgencyPublicDisplayDto | null;
  options: AgencyOption[];
  isLoading: boolean;
  feedback: AgenciesSubmitFeedback;
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
    fetchAgencyOptionsRequested: (
      state,
      _action: PayloadAction<ListAgencyOptionsRequestDto>,
    ) => {
      state.isLoading = true;
    },
    fetchAgencyOptionsSucceeded: (
      state,
      action: PayloadAction<AgencyOption[]>,
    ) => {
      state.options = action.payload;
      state.feedback = { kind: "success" };
      state.isLoading = false;
    },
    fetchAgencyOptionsFailed: (state, action: PayloadAction<string>) => {
      state.feedback = { kind: "errored", errorMessage: action.payload };
      state.isLoading = false;
    },
    addAgencyRequested: (state, _action: PayloadAction<CreateAgencyDto>) => {
      state.isLoading = true;
    },
    addAgencySucceeded: (state, _action: PayloadAction<void>) => {
      state.feedback = { kind: "agencyAdded" };
      state.isLoading = false;
    },
    addAgencyFailed: (state, action: PayloadAction<string>) => {
      state.feedback = { kind: "errored", errorMessage: action.payload };
      state.isLoading = false;
    },
    addAgencyCleared: (state, _action: PayloadAction<void>) => {
      state.feedback = { kind: "idle" };
      state.isLoading = false;
    },
  },
});
