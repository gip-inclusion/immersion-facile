import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AgencyDto, InclusionConnectedUser, WithAgencyIds } from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";

export type InclusionConnectedFeedback = SubmitFeedBack<
  "success" | "agencyRegistrationSuccess" | "agenciesToReviewFetchSuccess"
>;

type InclusionConnectedState = {
  currentUser: InclusionConnectedUser | null;
  isLoading: boolean;
  feedback: InclusionConnectedFeedback;
  agenciesToReview: AgencyDto[];
};

const initialState: InclusionConnectedState = {
  currentUser: null,
  isLoading: false,
  feedback: { kind: "idle" },
  agenciesToReview: [],
};

export const inclusionConnectedSlice = createSlice({
  name: "inclusionConnected",
  initialState,
  reducers: {
    currentUserFetchRequested: (state) => {
      state.isLoading = true;
    },
    currentUserFetchSucceeded: (
      state,
      action: PayloadAction<InclusionConnectedUser>,
    ) => {
      state.isLoading = false;
      state.currentUser = action.payload;
      state.feedback = { kind: "success" };
    },
    currentUserFetchFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    registerAgenciesRequested: (
      state,
      _payload: PayloadAction<WithAgencyIds>,
    ) => {
      state.isLoading = true;
    },
    registerAgenciesSucceeded: (state) => {
      state.isLoading = false;
      state.feedback = { kind: "agencyRegistrationSuccess" };
    },
    registerAgenciesFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
  },
});
