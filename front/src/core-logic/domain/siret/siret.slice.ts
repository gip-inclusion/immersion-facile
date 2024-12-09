import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { GetSiretInfoError, SiretDto, SiretEstablishmentDto } from "shared";
import { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";
import { ActionOfSlice } from "src/core-logic/storeConfig/redux.helpers";

export type InvalidSiretError = "SIRET must be 14 digits";

export interface SiretState {
  currentSiret: string;
  isSearching: boolean;
  shouldFetchEvenIfAlreadySaved: boolean;
  establishment: SiretEstablishmentDto | null;
  error: GetSiretInfoError | InvalidSiretError | null;
}

const initialState: SiretState = {
  currentSiret: "",
  isSearching: false,
  shouldFetchEvenIfAlreadySaved: true,
  establishment: null,
  error: null,
};

export const siretSlice = createSlice({
  name: "siret",
  initialState,
  reducers: {
    setShouldFetchEvenIfAlreadySaved: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.shouldFetchEvenIfAlreadySaved = action.payload;
    },
    siretModified: (
      state,
      action: PayloadActionWithFeedbackTopic<{ siret: SiretDto }>,
    ) => {
      state.currentSiret = action.payload.siret;
      state.establishment = null;
      state.error = null;
    },
    siretWasNotValid: (state) => {
      state.error = "SIRET must be 14 digits";
    },
    siretInfoRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ siret: SiretDto }>,
    ) => {
      state.isSearching = true;
    },
    siretInfoSucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<{
        siretEstablishment: SiretEstablishmentDto;
      }>,
    ) => {
      state.isSearching = false;
      state.establishment = action.payload.siretEstablishment;
    },
    siretInfoDisabledAndNoMatchInDbFound: (
      state,
      _action: PayloadAction<{
        siret: SiretDto;
      }>,
    ) => {
      state.isSearching = false;
      state.establishment = null;
    },
    siretInfoFailed: (state, action: PayloadAction<GetSiretInfoError>) => {
      state.isSearching = false;
      state.error = action.payload;
    },
    siretInfoClearRequested: () => initialState,
    siretToEstablishmentRedirectionRequested: (state) => state,
  },
});

export type SiretAction = ActionOfSlice<typeof siretSlice>;
