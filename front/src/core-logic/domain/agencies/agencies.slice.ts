import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConventionViewAgencyDto } from "shared/src/agency/agency.dto";
import { DepartmentCode } from "src/../../shared/src/address/address.dto";

// type AgencyState = {
//   items: AgencyDto[];
//   isLoading: boolean;
// };

// const initialState: AgencyState = {
//   items: [],
//   isLoading: false,
// };

// export type AgencyState = {
//   agencies: AgencyIdAndName[];
// };
//
// const initialState: AgencyState = {
//   agencies: []
// };

export type AgencyState = ConventionViewAgencyDto[];

const initialState: AgencyState = [];

export const agenciesSlice = createSlice({
  name: "agencies",
  initialState,
  reducers: {
    fetchAgenciesRequested: (state, _action: PayloadAction<DepartmentCode>) =>
      state,
    fetchAgenciesSucceeded: (
      _state,
      action: PayloadAction<ConventionViewAgencyDto[]>,
    ) => {
      // eslint-disable-next-line no-console
      console.log("fetchAgenciesSucceeded ", action.payload);
      return action.payload;
    },
  },
});
