import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AdminToken } from "shared/src/admin/admin.dto";

interface AdminState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    loginRequested: (
      state,
      _actions: PayloadAction<{ user: string; password: string }>,
    ) => {
      state.isLoading = true;
    },
    loginSucceeded: (state, _action: PayloadAction<AdminToken>) => {
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    loginFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    adminTokenStoredInDevice: (state) => state,
    checkIfLoggedInRequested: (state) => state,
    tokenFoundInDevice: (state) => {
      state.isAuthenticated = true;
    },
    noTokenFoundInDevice: (state) => {
      state.isAuthenticated = false;
    },
    logoutRequested: (state) => state,
    loggedOut: (state) => {
      state.isAuthenticated = false;
    },
  },
});
