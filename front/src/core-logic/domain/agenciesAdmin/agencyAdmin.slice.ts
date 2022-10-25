import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AgencyDto, AgencyId, AgencyOption } from "shared";

export interface AgencyAdminState {
  agencySearchText: string;
  agencyOptions: AgencyOption[];
  selectedAgencyId: AgencyId | null;
  agency: AgencyDto | null;
  isSearching: boolean;
  error: string | null;
}

const initialState: AgencyAdminState = {
  agencySearchText: "",
  agencyOptions: [],
  selectedAgencyId: null,
  agency: null,
  isSearching: false,
  error: null,
};

export const agencyAdminSlice = createSlice({
  name: "agencyAdmin",
  initialState,
  reducers: {
    setAgencySearchText: (state, action: PayloadAction<string>) => {
      state.agencySearchText = action.payload;
      state.isSearching = true;
    },
    setAgencyOptions: (state, action: PayloadAction<AgencyOption[]>) => {
      state.agencyOptions = action.payload;
      state.isSearching = false;
    },
    setSelectedAgencyId: (state, action: PayloadAction<AgencyId>) => {
      state.selectedAgencyId = action.payload;
    },
    setAgency: (state, action: PayloadAction<AgencyDto | null>) => {
      state.agency = action.payload ?? null;
    },
  },
});
