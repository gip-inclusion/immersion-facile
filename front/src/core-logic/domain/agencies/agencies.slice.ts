import { createSlice } from "@reduxjs/toolkit";
import { AgencyIdAndName } from "shared/src/agency/agency.dto";

// type AgencyState = {
//   items: AgencyDto[];
//   isLoading: boolean;
// };

// const initialState: AgencyState = {
//   items: [],
//   isLoading: false,
// };

const initialState: AgencyIdAndName[] = [];

export const agenciesSlice = createSlice({
  name: "agencies",
  initialState,
  reducers: {
    fetchAgenciesRequested: (state) => state,
    fetchAgenciesSucceeded: (state) => state,
  },
});
