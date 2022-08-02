import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EmailSentDto } from "shared/src/email/email";
import { AdminToken } from "shared/src/admin/admin.dto";

interface AdminState {
  adminToken: AdminToken | null;
  isLoading: boolean;
  sentEmails: EmailSentDto[];
  error: string | null;
}

const initialState: AdminState = {
  adminToken: null,
  isLoading: false,
  sentEmails: [],
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
    loginSucceeded: (state, action: PayloadAction<AdminToken>) => {
      state.adminToken = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    loginFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    adminTokenStoredInDevice: (state) => state,
    checkIfLoggedInRequested: (state) => state,
    tokenFoundInDevice: (state, action: PayloadAction<AdminToken>) => {
      state.adminToken = action.payload;
    },
    noTokenFoundInDevice: (state) => {
      state.adminToken = null;
    },
    logoutRequested: (state) => state,
    loggedOut: (state) => {
      state.adminToken = null;
    },
    lastSentEmailsRequested: (state) => {
      state.isLoading = true;
    },
    lastSentEmailsSucceeded: (state, action: PayloadAction<EmailSentDto[]>) => {
      state.sentEmails = action.payload;
      state.error = null;
      state.isLoading = false;
    },
    lastSentEmailsFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});
