import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AbsoluteUrl } from "shared";

export type DashboardsState = {
  conventions: AbsoluteUrl | null;
};

export const dashboardInitialState: DashboardsState = {
  conventions: null,
};

export const dashboardUrlsSlice = createSlice({
  name: "dashboardUrls",
  initialState: dashboardInitialState,
  reducers: {
    conventionsDashboardUrlRequested: (state) => state,
    conventionsDashboardUrlSucceeded: (
      state,
      action: PayloadAction<AbsoluteUrl>,
    ) => {
      state.conventions = action.payload;
    },
  },
});
