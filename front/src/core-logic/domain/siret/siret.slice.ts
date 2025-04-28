import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type {
  GetSiretInfoError,
  SiretDto,
  SiretEstablishmentDto,
} from "shared";
import type { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";
import type { AddressAutocompleteLocator } from "src/core-logic/domain/geocoding/geocoding.slice";
import type { ActionOfSlice } from "src/core-logic/storeConfig/redux.helpers";

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
      action: PayloadAction<{
        shouldFetchEvenIfAlreadySaved: boolean;
        addressAutocompleteLocator: AddressAutocompleteLocator;
      }>,
    ) => {
      state.shouldFetchEvenIfAlreadySaved =
        action.payload.shouldFetchEvenIfAlreadySaved;
    },
    siretModified: (
      state,
      action: PayloadActionWithFeedbackTopic<{
        siret: SiretDto;
        addressAutocompleteLocator: AddressAutocompleteLocator;
      }>,
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
      _action: PayloadActionWithFeedbackTopic<{
        siret: SiretDto;
        addressAutocompleteLocator: AddressAutocompleteLocator;
      }>,
    ) => {
      state.isSearching = true;
    },
    siretInfoSucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<{
        siretEstablishment: SiretEstablishmentDto;
        addressAutocompleteLocator: AddressAutocompleteLocator;
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
