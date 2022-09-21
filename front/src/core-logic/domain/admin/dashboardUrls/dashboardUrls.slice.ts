import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";

export type DashboardsState = {
  conventions: AbsoluteUrl | null;
};

const initialState: DashboardsState = {
  conventions: null,
};

export const dashboardUrlsSlice = createSlice({
  name: "dashboardUrls",
  initialState,
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
