import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FederatedIdentity } from "shared/src/federatedIdentities/federatedIdentity.dto";

interface AuthState {
  connectedWith: FederatedIdentity | null;
}

const initialState: AuthState = {
  connectedWith: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    federatedIdentityProvided: (
      state,
      action: PayloadAction<FederatedIdentity>,
    ) => {
      state.connectedWith = action.payload;
    },
  },
});
