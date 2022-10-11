import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AgencyIdAndName } from "shared";

export type AgencyState = AgencyIdAndName[];

const initialState: AgencyState = [];

export const agenciesSlice = createSlice({
  name: "agencies",
  initialState,
  reducers: {
    fetchAgenciesByDepartmentCodeRequested: (
      state,
      _action: PayloadAction<string>,
    ) => state,
    fetchAgenciesByDepartmentCodeSucceeded: (
      _state,
      action: PayloadAction<AgencyIdAndName[]>,
    ) => action.payload,
  },
});
