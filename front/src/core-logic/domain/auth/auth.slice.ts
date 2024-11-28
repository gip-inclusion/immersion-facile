import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { AbsoluteUrl, FederatedIdentity } from "shared";
import { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";

export type FederatedIdentityWithUser = FederatedIdentity & {
  email: string;
  firstName: string;
  lastName: string;
};

type WithUrl = {
  url: AbsoluteUrl;
};

interface AuthState {
  isLoading: boolean;
  federatedIdentityWithUser: FederatedIdentityWithUser | null;
  afterLoginRedirectionUrl: AbsoluteUrl | null;
}

const initialState: AuthState = {
  isLoading: true,
  federatedIdentityWithUser: null,
  afterLoginRedirectionUrl: null,
};

const onFederatedIdentityReceived = (
  state: AuthState,
  action: PayloadActionWithFeedbackTopic<{
    federatedIdentityWithUser: FederatedIdentityWithUser | null;
  }>,
) => {
  state.isLoading = false;
  state.federatedIdentityWithUser = action.payload.federatedIdentityWithUser;
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    saveRedirectionAfterLoginRequested: (
      _state,
      _action: PayloadAction<WithUrl>,
    ) => {},
    saveRedirectAfterLoginSucceeded: (
      state,
      action: PayloadAction<WithUrl>,
    ) => {
      state.afterLoginRedirectionUrl = action.payload.url;
    },
    redirectionAfterLoginFoundInDevice: (
      state,
      action: PayloadAction<WithUrl>,
    ) => {
      state.afterLoginRedirectionUrl = action.payload.url;
    },
    redirectionAfterLoginNotFoundInDevice: (state) => state,
    redirectAndClearUrlAfterLoginRequested: () => {},
    redirectAndClearUrlAfterLoginSucceeded: (
      state,
      _action: PayloadAction<WithUrl | undefined>,
    ) => {
      state.afterLoginRedirectionUrl = null;
    },
    federatedIdentityProvided: onFederatedIdentityReceived,
    federatedIdentityFoundInDevice: onFederatedIdentityReceived,
    federatedIdentityFromStoreToDeviceStorageSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        federatedIdentityWithUser: FederatedIdentityWithUser;
      }>,
    ) => state,
    federatedIdentityNotFoundInDevice: (state) => {
      state.isLoading = false;
    },
    federatedIdentityDeletionTriggered: (
      state,
      _action: PayloadAction<{
        mode: "device-only" | "device-and-inclusion";
      }>,
    ) => state,
    federatedIdentityInDeviceDeletionSucceeded: (state) => {
      state.federatedIdentityWithUser = null;
    },
    loggedOutSuccessfullyFromProvider: (state) => state,
    loggedOutFailedFromInclusionConnect: (state) => {
      state.federatedIdentityWithUser = null;
    },
  },
});
