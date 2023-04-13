import { createSlice, PayloadAction } from "@reduxjs/toolkit";
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

    federatedIdentityFromStoreToDeviceStorageSucceeded: (state) => state,

    federatedIdentityFoundInDevice: onFederatedIdentityReceived,
    federatedIdentityNotFoundInDevice: (state) => state,

    federatedIdentityDeletionTriggered: (state) => {
      state.federatedIdentityWithUser = null;
    },
    federatedIdentityInDeviceDeletionSucceeded: (state) => state,
  },
});
