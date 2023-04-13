import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { BackOfficeJwt } from "shared";

export type AdminAuthState = {
  adminToken: BackOfficeJwt | null;
  isLoading: boolean;
  error: string | null;
};

export const adminAuthInitialState: AdminAuthState = {
  adminToken: null,
  isLoading: false,
  error: null,
};

export const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState: adminAuthInitialState,
  reducers: {
    loginRequested: (
      state,
      _actions: PayloadAction<{ user: string; password: string }>,
    ) => {
      state.isLoading = true;
    },
    loginSucceeded: (state, action: PayloadAction<BackOfficeJwt>) => {
      state.adminToken = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    loginFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    adminTokenStoredInDevice: (state) => state,
    tokenFoundInDevice: (state, action: PayloadAction<BackOfficeJwt>) => {
      state.adminToken = action.payload;
    },
    noTokenFoundInDevice: (state) => {
      state.adminToken = null;
    },
    logoutRequested: (state) => state,
    loggedOut: (state) => {
      state.adminToken = null;
    },
  },
});
