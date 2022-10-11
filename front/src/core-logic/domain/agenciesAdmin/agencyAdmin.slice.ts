import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AgencyDto, AgencyIdAndName } from "shared";
import { AgencySubmitFeedback } from "src/app/components/agency/AgencySubmitFeedback";

interface AgencyAutocompleteState {
  agencySearchText: string;
  agencyOptions: AgencyIdAndName[];
  selectedAgency: AgencyIdAndName | null;
  agency: AgencyDto | null;
  isSearching: boolean;
  feedback: AgencySubmitFeedback;
}

const initialState: AgencyAutocompleteState = {
  agencySearchText: "",
  agencyOptions: [],
  selectedAgency: null,
  agency: null,
  isSearching: false,
  feedback: { kind: "idle" },
};

export const agencyAdminSlice = createSlice({
  name: "agencyAdmin",
  initialState,
  reducers: {
    setAgencySearchText: (state, action: PayloadAction<string>) => {
      state.agencySearchText = action.payload;
      state.selectedAgency = null;
    },
    searchStarted: (state) => {
      state.isSearching = true;
    },
    setAgencyOptions: (state, action: PayloadAction<AgencyIdAndName[]>) => {
      state.agencyOptions = action.payload;
      state.isSearching = false;
    },
    setSelectedAgency: (state, action: PayloadAction<AgencyIdAndName>) => {
      state.selectedAgency = action.payload;
    },
    setAgency: (state, action: PayloadAction<AgencyDto | null>) => {
      state.agency = action.payload ?? null;
    },
  },
});
