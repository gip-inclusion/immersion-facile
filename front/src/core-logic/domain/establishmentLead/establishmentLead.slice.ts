import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ConventionJwt } from "shared";

export type EstablishmentLeadUIStatus = "Idle" | "Loading" | "Success";

export type EstablishmentLeadState = {
  status: EstablishmentLeadUIStatus;
  error: string | null;
};

const initialState: EstablishmentLeadState = {
  status: "Idle",
  error: null,
};

export const establishmentLeadSlice = createSlice({
  name: "establishmentLead",
  initialState,
  reducers: {
    unsubscribeEstablishmentLeadRequested: (
      state,
      _action: PayloadAction<ConventionJwt>,
    ) => {
      state.status = "Loading";
    },
    unsubscribeEstablishmentLeadSucceeded: (state) => {
      state.status = "Success";
    },
    unsubscribeEstablishmentLeadFailed: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.status = "Idle";
      state.error = action.payload;
    },
  },
});
