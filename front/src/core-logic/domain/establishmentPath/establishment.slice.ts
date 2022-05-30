import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SiretDto } from "shared/src/siret";
import { siretSlice } from "src/core-logic/domain/siret/siret.slice";

export type EstablishmentState = {
  isLoading: boolean;
  linkSent: boolean;
};

const initialState: EstablishmentState = {
  isLoading: false,
  linkSent: false,
};

export const establishmentSlice = createSlice({
  name: "establishment",
  initialState,
  reducers: {
    sendModificationLinkRequested: (
      state,
      _action: PayloadAction<SiretDto>,
    ) => {
      state.isLoading = true;
    },
    sendModificationLinkSucceeded: (state) => {
      state.isLoading = false;
      state.linkSent = true;
    },
  },
  extraReducers: (builder) => {
    // linkSent is forgotten if the siret is modified
    builder.addCase(siretSlice.actions.siretModified.type, (state) => {
      state.linkSent = false;
    });
  },
});
