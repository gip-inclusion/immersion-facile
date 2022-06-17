import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GetSiretInfoError } from "src/core-logic/ports/SiretGatewayThroughBack";
import { ActionOfSlice } from "src/core-logic/storeConfig/redux.helpers";
import { GetSiretResponseDto } from "shared/src/siret";

export type InvalidSiretError = "SIRET must be 14 digits";

export interface SiretState {
  currentSiret: string;
  isSearching: boolean;
  shouldFetchEvenIfAlreadySaved: boolean;
  establishment: GetSiretResponseDto | null;
  error: GetSiretInfoError | InvalidSiretError | null;
}

const initialState: SiretState = {
  currentSiret: "",
  isSearching: false,
  shouldFetchEvenIfAlreadySaved: false,
  establishment: null,
  error: null,
};

export const siretSlice = createSlice({
  name: "siret",
  initialState,
  reducers: {
    toggleShouldFetchEvenIfAlreadySaved: (state): SiretState => ({
      ...initialState,
      shouldFetchEvenIfAlreadySaved: !state.shouldFetchEvenIfAlreadySaved,
    }),
    siretModified: (state, action: PayloadAction<string>) => {
      state.currentSiret = action.payload;
      state.establishment = null;
      state.error = null;
    },
    siretWasNotValid: (state) => {
      state.error = "SIRET must be 14 digits";
    },
    siretInfoRequested: (state, _action: PayloadAction<string>) => {
      state.isSearching = true;
    },
    siretInfoSucceeded: (state, action: PayloadAction<GetSiretResponseDto>) => {
      state.isSearching = false;
      state.establishment = action.payload;
    },
    siretInfoDisabledAndNoMatchInDbFound: (state) => {
      state.isSearching = false;
      state.establishment = null;
    },
    siretInfoFailed: (state, action: PayloadAction<GetSiretInfoError>) => {
      state.isSearching = false;
      state.error = action.payload;
    },
  },
});

export type SiretAction = ActionOfSlice<typeof siretSlice>;
