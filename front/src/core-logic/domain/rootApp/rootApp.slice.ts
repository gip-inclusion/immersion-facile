import { createSlice } from "@reduxjs/toolkit";

export const rootAppSlice = createSlice({
  name: "rootApp",
  initialState: {},
  reducers: {
    appIsReady: (state) => state,
    appResetRequested: (state) => state,
  },
});
