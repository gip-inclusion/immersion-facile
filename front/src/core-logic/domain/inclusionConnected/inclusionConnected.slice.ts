import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { AgencyDto, InclusionConnectedUser, WithAgencyIds } from "shared";
import { updateUserAgencyRights } from "src/core-logic/domain/agencies/agencies.helpers";
import { removeUserFromAgencySlice } from "src/core-logic/domain/agencies/remove-user-from-agency/removeUserFromAgency.slice";
import { updateUserOnAgencySlice } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";
import {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

type InclusionConnectedState = {
  currentUser: InclusionConnectedUser | null;
  isLoading: boolean;
  agenciesToReview: AgencyDto[];
};

const initialState: InclusionConnectedState = {
  currentUser: null,
  isLoading: false,
  agenciesToReview: [],
};

export const inclusionConnectedSlice = createSlice({
  name: "inclusionConnected",
  initialState,
  reducers: {
    currentUserFetchRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic,
    ) => {
      state.isLoading = true;
    },
    currentUserFetchSucceeded: (
      state,
      action: PayloadAction<InclusionConnectedUser>,
    ) => {
      state.isLoading = false;
      state.currentUser = action.payload;
    },
    currentUserFetchFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
    registerAgenciesRequested: (
      state,
      _payload: PayloadActionWithFeedbackTopic<WithAgencyIds>,
    ) => {
      state.isLoading = true;
    },
    registerAgenciesSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<WithAgencyIds>,
    ) => {
      state.isLoading = false;
      //state.feedback = { kind: "agencyRegistrationSuccess" };
    },
    registerAgenciesFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      updateUserOnAgencySlice.actions.updateUserAgencyRightSucceeded,
      (state, action) => {
        if (
          !state.currentUser ||
          state.currentUser.id !== action.payload.userId
        )
          return;
        state.currentUser = updateUserAgencyRights(
          state.currentUser,
          action.payload,
        );
      },
    );
    builder.addCase(
      removeUserFromAgencySlice.actions.removeUserFromAgencySucceeded,
      (state, action) => {
        if (
          !state.currentUser ||
          state.currentUser.id !== action.payload.userId
        )
          return;

        state.currentUser.agencyRights = state.currentUser.agencyRights.filter(
          (right) => right.agency.id !== action.payload.agencyId,
        );
      },
    );
  },
});
