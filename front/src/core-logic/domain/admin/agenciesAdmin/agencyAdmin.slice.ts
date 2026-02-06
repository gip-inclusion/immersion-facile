import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AgencyOption } from "shared";

export interface AgencyAdminState {
  agencySearchQuery: string;
  agencyOptions: AgencyOption[];
  isLoading: boolean;
}

export const agencyAdminInitialState: AgencyAdminState = {
  agencySearchQuery: "",
  agencyOptions: [],
  isLoading: false,
};

export const agencyAdminSlice = createSlice({
  name: "agencyAdmin",
  initialState: agencyAdminInitialState,
  reducers: {
    setAgencySearchQuery: (state, action: PayloadAction<string>) => {
      state.agencySearchQuery = action.payload;
      state.isLoading = true;
    },
    setAgencyOptions: (state, action: PayloadAction<AgencyOption[]>) => {
      state.agencyOptions = action.payload;
      state.isLoading = false;
    },
  },
});
