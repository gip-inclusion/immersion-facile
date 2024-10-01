import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { AbsoluteUrl, FederatedIdentity } from "shared";

export type FederatedIdentityWithUser = FederatedIdentity & {
  email: string;
  firstName: string;
  lastName: string;
};

interface AuthState {
  federatedIdentityWithUser: FederatedIdentityWithUser | null;
  afterLoginRedirectionUrl: AbsoluteUrl | null;
}

const initialState: AuthState = {
  federatedIdentityWithUser: null,
  afterLoginRedirectionUrl: null,
};

const onFederatedIdentityReceived = (
  state: AuthState,
  action: PayloadAction<FederatedIdentityWithUser | null>,
) => {
  state.federatedIdentityWithUser = action.payload;
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    saveRedirectionAfterLoginRequested: (
      _state,
      _action: PayloadAction<{
        url: AbsoluteUrl;
      }>,
    ) => {},
    saveRedirectAfterLoginSucceeded: (
      state,
      action: PayloadAction<{
        url: AbsoluteUrl;
      }>,
    ) => {
      state.afterLoginRedirectionUrl = action.payload.url;
    },
    clearRedirectAfterLoginRequested: () => {},
    clearRedirectAfterLoginSucceeded: (state) => {
      state.afterLoginRedirectionUrl = null;
    },
    federatedIdentityProvided: onFederatedIdentityReceived,
    federatedIdentityFoundInDevice: onFederatedIdentityReceived,
    federatedIdentityFromStoreToDeviceStorageSucceeded: (
      state,
      _action: PayloadAction<FederatedIdentityWithUser | null>,
    ) => state,
    federatedIdentityNotFoundInDevice: (state) => state,
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
