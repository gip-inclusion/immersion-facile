import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type {
  AbsoluteUrl,
  Email,
  FederatedIdentity,
  WithRedirectUri,
} from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export type FederatedIdentityWithUser = FederatedIdentity & {
  email: string;
  firstName: string;
  lastName: string;
};

type WithUrl = {
  url: AbsoluteUrl;
};

export interface AuthState {
  isLoading: boolean;
  isRequestingLoginByEmail: boolean;
  requestedEmail: Email | null;
  federatedIdentityWithUser: FederatedIdentityWithUser | null;
  afterLoginRedirectionUrl: AbsoluteUrl | null;
}

const initialState: AuthState = {
  isLoading: true,
  isRequestingLoginByEmail: false,
  federatedIdentityWithUser: null,
  afterLoginRedirectionUrl: null,
  requestedEmail: null,
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
    logOutFromProviderSucceeded: (state) => state,
    logOutFromProviderFailed: (state) => {
      state.federatedIdentityWithUser = null;
    },
    loginByEmailRequested: (
      state,
      action: PayloadActionWithFeedbackTopic<
        WithRedirectUri & {
          email: Email;
        }
      >,
    ) => {
      state.isRequestingLoginByEmail = true;
      state.requestedEmail = action.payload.email; // TODO test à faire évoluer
    },
    loginByEmailSucceded: (state, _action: PayloadActionWithFeedbackTopic) => {
      state.isRequestingLoginByEmail = false;
    },
    loginByEmailFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isRequestingLoginByEmail = false;
    },
  },
});
