import { createSlice } from "@reduxjs/toolkit";
import { AgencyDto } from "shared/src/agency/agency.dto";

type AgencyState = {
  items: AgencyDto[];
  isLoading: boolean;
};

const initialState: AgencyState = {
  items: [],
  isLoading: false,
};

export const agenciesSlice = createSlice({
  name: "agencies",
  initialState,
  reducers: {
    fetchAgenciesRequested: (state) => ({
      ...state,
      isLoading: true,
    }),
  },
});
