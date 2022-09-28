import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RomeCode } from "shared";
import { RomeDto } from "shared";

interface RomeAutocompleteState {
  romeSearchText: string;
  romeOptions: RomeDto[];
  selectedRome: RomeCode | null;
  isSearching: boolean;
}

const initialState: RomeAutocompleteState = {
  romeSearchText: "",
  romeOptions: [],
  selectedRome: null,
  isSearching: false,
};

export const romeAutocompleteSlice = createSlice({
  name: "romeAutocomplete",
  initialState,
  reducers: {
    setRomeSearchText: (state, action: PayloadAction<string>) => {
      state.romeSearchText = action.payload;
      state.selectedRome = null;
    },
    searchStarted: (state) => {
      state.isSearching = true;
    },
    setRomeOptions: (state, action: PayloadAction<RomeDto[]>) => {
      state.romeOptions = action.payload;
      state.isSearching = false;
    },
    setSelectedRome: (state, action: PayloadAction<RomeDto | null>) => {
      state.selectedRome = action.payload?.romeCode ?? null;
      state.romeSearchText = action.payload?.romeLabel ?? "";
    },
  },
});
