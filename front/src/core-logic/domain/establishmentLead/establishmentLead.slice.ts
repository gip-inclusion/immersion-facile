import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ConventionJwt } from "shared";

export type EstablishmentLeadUIStatus =
  | "idle"
  | "loading"
  | "success"
  | "errored";

export type EstablishmentLeadState = {
  status: EstablishmentLeadUIStatus;
  error: string | null;
};

const initialState: EstablishmentLeadState = {
  status: "idle",
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
      state.status = "loading";
    },
    unsubscribeEstablishmentLeadSucceeded: (state) => {
      state.status = "success";
    },
    unsubscribeEstablishmentLeadFailed: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.status = "errored";
      state.error = action.payload;
    },
  },
});
