import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SiretDto } from "shared";

type EstablishmentUiStatus =
  | "IDLE"
  | "READY_FOR_LINK_REQUEST_OR_REDIRECTION"
  | "LINK_SENT";

export type EstablishmentState = {
  isLoading: boolean;
  status: EstablishmentUiStatus;
};

const initialState: EstablishmentState = {
  isLoading: false,
  status: "IDLE",
};

export const establishmentSlice = createSlice({
  name: "establishment",
  initialState,
  reducers: {
    gotReady: (state) => {
      state.status = "READY_FOR_LINK_REQUEST_OR_REDIRECTION";
    },
    navigatedAwayFromHome: (state) => {
      state.status = "IDLE";
    },
    sendModificationLinkRequested: (
      state,
      _action: PayloadAction<SiretDto>,
    ) => {
      state.isLoading = true;
    },
    sendModificationLinkSucceeded: (state) => {
      state.isLoading = false;
      state.status = "LINK_SENT";
    },
  },
});
