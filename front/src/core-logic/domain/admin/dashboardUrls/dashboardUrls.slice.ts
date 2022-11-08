import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AbsoluteUrl, DashboardName } from "shared";

export type DashboardsState = Record<DashboardName, AbsoluteUrl | null> & {
  errorMessage: string | null;
};

export const dashboardInitialState: DashboardsState = {
  conventions: null,
  agency: null,
  events: null,
  errorMessage: null,
};

export const dashboardUrlsSlice = createSlice({
  name: "dashboardUrls",
  initialState: dashboardInitialState,
  reducers: {
    dashboardUrlRequested: (state, _action: PayloadAction<DashboardName>) => {
      state.errorMessage = null;
    },
    dashboardUrlSucceeded: (
      state,
      action: PayloadAction<{ dashboardName: DashboardName; url: AbsoluteUrl }>,
    ) => {
      state[action.payload.dashboardName] = action.payload.url;
    },
    dashboardUrlFailed: (state, action: PayloadAction<string>) => {
      state.errorMessage = action.payload;
    },
  },
});
