import { createSlice } from "@reduxjs/toolkit";
import type { UserParamsForAgency, WithAgencyId } from "shared";
import { NormalizedInclusionConnectedUser } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

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
          icUser: NormalizedInclusionConnectedUser;
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
