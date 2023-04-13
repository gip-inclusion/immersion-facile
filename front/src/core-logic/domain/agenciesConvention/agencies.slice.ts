import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AgencyOption } from "shared";

export type AgencyState = AgencyOption[];

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
      action: PayloadAction<AgencyOption[]>,
    ) => action.payload,
  },
});
