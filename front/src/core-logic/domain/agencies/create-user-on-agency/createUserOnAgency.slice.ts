import { createSlice } from "@reduxjs/toolkit";
import type { UserParamsForAgency, WithAgencyId } from "shared";
import type { ConnectedUserWithNormalizedAgencyRights } from "src/core-logic/domain/admin/connectedUsersAdmin/connectedUsersAdmin.slice";
import type { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

export interface CreateUserOnAgencyState {
  isLoading: boolean;
}

export const createUserOnAgencyInitialState: CreateUserOnAgencyState = {
  isLoading: false,
};

export const createUserOnAgencySlice = createSlice({
  name: "createUserOnAgency",
  initialState: createUserOnAgencyInitialState,
  reducers: {
    createUserOnAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<UserParamsForAgency>,
    ) => {
      state.isLoading = true;
    },

    createUserOnAgencySucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<
        {
          icUser: ConnectedUserWithNormalizedAgencyRights;
        } & WithAgencyId
      >,
    ) => {
      state.isLoading = false;
    },

    createUserOnAgencyFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isLoading = false;
    },
  },
});
