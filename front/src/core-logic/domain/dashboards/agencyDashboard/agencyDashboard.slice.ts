import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { filter } from "ramda";
import type {
  AgencyDto,
  UserParamsForAgency,
  WithAgencyId,
  WithAgencyIdAndUserId,
} from "shared";
import {
  NormalizedIcUserById,
  NormalizedInclusionConnectedUser,
} from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

export interface AgencyDashboardState {
  agency: AgencyDto | null;
  agencyUsers: NormalizedIcUserById;
  isFetchingAgencyUsers: boolean;
  isFetchingAgency: boolean;
  isUpdating: boolean;
  error: string | null;
}

export const agencyDashboardInitialState: AgencyDashboardState = {
  agency: null,
  agencyUsers: {},
  isFetchingAgencyUsers: false,
  isFetchingAgency: false,
  isUpdating: false,
  error: null,
};

export const agencyDashboardSlice = createSlice({
  name: "agencyDashboard",
  initialState: agencyDashboardInitialState,
  reducers: {
    fetchAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<WithAgencyId>,
    ) => {
      state.agency = null;
    },

    fetchAgencySucceeded: (state, action: PayloadAction<AgencyDto>) => {
      state.isFetchingAgency = false;
      state.agency = action.payload;
    },

    fetchAgencyFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isFetchingAgency = false;
    },

    fetchAgencyUsersRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<WithAgencyId>,
    ) => {
      state.isFetchingAgencyUsers = true;
    },

    fetchAgencyUsersSucceeded: (
      state,
      action: PayloadAction<NormalizedIcUserById>,
    ) => {
      state.isFetchingAgencyUsers = false;
      state.agencyUsers = action.payload;
    },
    fetchAgencyUsersFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isFetchingAgencyUsers = false;
    },

    updateAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<AgencyDto>,
    ) => {
      state.isUpdating = true;
    },
    updateAgencySucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<AgencyDto>,
    ) => {
      state.isUpdating = false;
    },

    updateAgencyFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isUpdating = false;
    },

    createUserOnAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<UserParamsForAgency>,
    ) => {
      state.isUpdating = true;
    },

    createUserOnAgencySucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<
        {
          icUser: NormalizedInclusionConnectedUser;
        } & WithAgencyId
      >,
    ) => {
      state.isUpdating = false;
      const { id } = action.payload.icUser;

      state.agencyUsers[id] = action.payload.icUser;
    },

    createUserOnAgencyFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isUpdating = false;
    },

    updateUserOnAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<UserParamsForAgency>,
    ) => {
      state.isUpdating = true;
    },

    updateUserOnAgencySucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<UserParamsForAgency>,
    ) => {
      state.isUpdating = false;
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

    updateUserOnAgencyFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isUpdating = false;
    },

    removeUserFromAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<WithAgencyIdAndUserId>,
    ) => {
      state.isUpdating = true;
    },

    removeUserFromAgencySucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<WithAgencyIdAndUserId>,
    ) => {
      state.isUpdating = false;
      state.agencyUsers = filter(
        (agencyUser) => agencyUser.id !== action.payload.userId,
        state.agencyUsers,
      );
    },

    removeUserFromAgencyFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isUpdating = false;
    },

    clearAgencyAndUsers: (state) => {
      state.agency = null;
      state.agencyUsers = {};
    },
  },
});
