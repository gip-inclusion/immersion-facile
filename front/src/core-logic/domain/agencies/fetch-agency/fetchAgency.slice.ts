import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { AgencyDto, WithAgencyId } from "shared";
import { NormalizedIcUserById } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { updateAgencySlice } from "src/core-logic/domain/agencies/update-agency/updateAgency.slice";
import { updateUserOnAgencySlice } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";
import { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

export interface FetchAgencyState {
  agency: AgencyDto | null;
  agencyUsers: NormalizedIcUserById;
  isLoading: boolean;
}

export const fetchAgencyInitialState: FetchAgencyState = {
  agency: null,
  agencyUsers: {},
  isLoading: false,
};

export const fetchAgencySlice = createSlice({
  name: "fetchAgency",
  initialState: fetchAgencyInitialState,
  reducers: {
    fetchAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<WithAgencyId>,
    ) => {
      state.agency = null;
    },

    fetchAgencySucceeded: (state, action: PayloadAction<AgencyDto>) => {
      state.isLoading = false;
      state.agency = action.payload;
    },

    fetchAgencyFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isLoading = false;
    },

    fetchAgencyUsersRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<WithAgencyId>,
    ) => {
      state.isLoading = true;
    },

    fetchAgencyUsersSucceeded: (
      state,
      action: PayloadAction<NormalizedIcUserById>,
    ) => {
      state.isLoading = false;
      state.agencyUsers = action.payload;
    },
    fetchAgencyUsersFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isLoading = false;
    },

    clearAgencyAndUsers: (state) => {
      state.agency = null;
      state.agencyUsers = {};
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      updateAgencySlice.actions.updateAgencySucceeded,
      (state, action) => {
        if (!state.agency) return;
        const { feedbackTopic: _, ...agency } = action.payload;
        state.agency = agency;
      },
    );
    builder.addCase(
      updateUserOnAgencySlice.actions.updateUserAgencyRightSucceeded,
      (state, action) => {
        if (!state.agencyUsers) return;
        const {
          userId,
          agencyId,
          roles: newRoles,
          email,
          isNotifiedByEmail,
        } = action.payload;
        state.agencyUsers[userId].agencyRights[agencyId].roles = newRoles;
        state.agencyUsers[userId].agencyRights[agencyId].isNotifiedByEmail =
          isNotifiedByEmail;
        state.agencyUsers[userId].email =
          email ?? state.agencyUsers[userId].email;
      },
    );
  },
});
