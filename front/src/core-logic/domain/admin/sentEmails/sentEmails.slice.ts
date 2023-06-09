import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EmailNotification } from "shared";

export type SentEmailsState = {
  isLoading: boolean;
  error: string | null;
  sentEmails: EmailNotification[];
};

export const sentEmailInitialState: SentEmailsState = {
  isLoading: false,
  sentEmails: [],
  error: null,
};

export const sentEmailsSlice = createSlice({
  name: "sentEmails",
  initialState: sentEmailInitialState,
  reducers: {
    lastSentEmailsRequested: (state) => {
      state.isLoading = true;
    },
    lastSentEmailsSucceeded: (
      state,
      action: PayloadAction<EmailNotification[]>,
    ) => {
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
