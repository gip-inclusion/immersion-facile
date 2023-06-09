import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EmailNotification, SmsNotification } from "shared";

export type SentEmailsState = {
  isLoading: boolean;
  error: string | null;
  lastEmails: EmailNotification[];
  lastSms: SmsNotification[];
};

export const notificationsInitialState: SentEmailsState = {
  lastEmails: [],
  lastSms: [],
  isLoading: false,
  error: null,
};

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState: notificationsInitialState,
  reducers: {
    lastSentEmailsRequested: (state) => {
      state.isLoading = true;
    },
    lastSentEmailsSucceeded: (
      state,
      action: PayloadAction<EmailNotification[]>,
    ) => {
      state.lastEmails = action.payload;
      state.error = null;
      state.isLoading = false;
    },
    lastSentEmailsFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});
