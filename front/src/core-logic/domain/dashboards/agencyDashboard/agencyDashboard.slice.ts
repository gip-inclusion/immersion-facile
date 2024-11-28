import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { filter } from "ramda";
import type {
  AgencyDto,
  AgencyId,
  UserParamsForAgency,
  WithAgencyId,
  WithAgencyIdAndUserId,
} from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";
import {
  NormalizedIcUserById,
  NormalizedInclusionConnectedUser,
} from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

export type AgencyDashboardSuccessFeedbackKind = "agencyUpdated";

export type AgencyDashboardSubmitFeedback =
  SubmitFeedBack<AgencyDashboardSuccessFeedbackKind>;

export interface AgencyDashboardState {
  agency: AgencyDto | null;
  agencyUsers: NormalizedIcUserById;
  isFetchingAgencyUsers: boolean;
  isFetchingAgency: boolean;
  isUpdating: boolean;
  isUpdatingIcUserAgency: boolean;
  error: string | null;
  feedback: AgencyDashboardSubmitFeedback;
}

export const agencyDashboardInitialState: AgencyDashboardState = {
  agency: null,
  agencyUsers: {},
  isFetchingAgencyUsers: false,
  isFetchingAgency: false,
  isUpdating: false,
  isUpdatingIcUserAgency: false,
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
    },
    fetchAgencyUsersFailed: (state, action: PayloadAction<string>) => {
      state.isFetchingAgencyUsers = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },

    updateAgencyRequested: (state, _action: PayloadAction<AgencyDto>) => {
      state.isUpdating = true;
      state.feedback = { kind: "idle" };
    },
    updateAgencySucceeded: (state, _action: PayloadAction<AgencyDto>) => {
      state.isUpdating = false;
      state.feedback = { kind: "agencyUpdated" };
    },

    updateAgencyFailed: (state, action: PayloadAction<string>) => {
      state.isUpdating = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },

    createUserOnAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<UserParamsForAgency>,
    ) => {
      state.isUpdatingIcUserAgency = true;
    },

    createUserOnAgencySucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<
        {
          icUser: NormalizedInclusionConnectedUser;
        } & WithAgencyId
      >,
    ) => {
      state.isUpdatingIcUserAgency = false;
      const { id } = action.payload.icUser;

      state.agencyUsers[id] = action.payload.icUser;
    },

    createUserOnAgencyFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isUpdatingIcUserAgency = false;
    },

    updateUserOnAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<UserParamsForAgency>,
    ) => {
      state.isUpdatingIcUserAgency = true;
    },

    updateUserOnAgencySucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<UserParamsForAgency>,
    ) => {
      state.isUpdatingIcUserAgency = false;
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
      state.isUpdatingIcUserAgency = false;
    },

    removeUserFromAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<WithAgencyIdAndUserId>,
    ) => {
      state.isUpdatingIcUserAgency = true;
    },

    removeUserFromAgencySucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<WithAgencyIdAndUserId>,
    ) => {
      state.isUpdatingIcUserAgency = false;
      state.agencyUsers = filter(
        (agencyUser) => agencyUser.id !== action.payload.userId,
        state.agencyUsers,
      );
    },

    removeUserFromAgencyFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isUpdatingIcUserAgency = false;
    },

    clearAgencyAndUsers: (state) => {
      state.agency = null;
      state.agencyUsers = {};
      state.feedback = { kind: "idle" };
    },
  },
});
