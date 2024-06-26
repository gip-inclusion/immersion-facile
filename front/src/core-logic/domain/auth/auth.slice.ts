import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { FederatedIdentity } from "shared";

export type FederatedIdentityWithUser = FederatedIdentity & {
  email: string;
  firstName: string;
  lastName: string;
};

interface AuthState {
  federatedIdentityWithUser: FederatedIdentityWithUser | null;
}

const initialState: AuthState = {
  federatedIdentityWithUser: null,
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
    loggedOutSuccessfullyFromInclusionConnect: (state) => state,
    loggedOutFailedFromInclusionConnect: (state) => {
      state.federatedIdentityWithUser = null;
    },
  },
});
