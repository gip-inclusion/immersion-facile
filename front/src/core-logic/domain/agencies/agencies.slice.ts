import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AgencyIdAndName } from "shared/src/agency/agency.dto";

export type AgencyState = AgencyIdAndName[];

const initialState: AgencyState = [];

export const agenciesSlice = createSlice({
  name: "agencies",
  initialState,
  reducers: {
    fetchAgenciesRequested: (state, _action: PayloadAction<string>) => state,
    fetchAgenciesSucceeded: (
      _state,
      action: PayloadAction<AgencyIdAndName[]>,
    ) => action.payload,
  },
});
