import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FederatedIdentity } from "shared/src/federatedIdentities/federatedIdentity.dto";

interface AuthState {
  connectedWith: FederatedIdentity | null;
}

const initialState: AuthState = {
  connectedWith: null,
};

const onFederatedIdentityReceived = (
  state: AuthState,
  action: PayloadAction<FederatedIdentity>,
) => {
  state.connectedWith = action.payload;
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    federatedIdentityProvided: onFederatedIdentityReceived,

    federatedIdentityFromStoreToDeviceStorageTriggered: (state) => state,
    federatedIdentityFromStoreToDeviceStorageSucceeded: (state) => state,

    federatedIdentityFoundInDevice: onFederatedIdentityReceived,
    federatedIdentityNotFoundInDevice: (state) => state,

    federatedIdentityInDeviceDeletionTriggered: (state) => state,
    federatedIdentityInDeviceDeletionSucceeded: (state) => state,
  },
});
