import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SiretDto } from "shared";
import { SubmitFeedBack } from "../SubmitFeedback";

type EstablishmentUiStatus =
  | "ERRORED"
  | "IDLE"
  | "READY_FOR_LINK_REQUEST_OR_REDIRECTION"
  | "LINK_SENT";

type EstablishmentFeedback = SubmitFeedBack<"success">;

export type EstablishmentState = {
  isLoading: boolean;
  status: EstablishmentUiStatus;
  feedback: EstablishmentFeedback;
};

const initialState: EstablishmentState = {
  isLoading: false,
  status: "IDLE",
  feedback: {
    kind: "idle",
  },
};

export const establishmentSlice = createSlice({
  name: "establishment",
  initialState,
  reducers: {
    gotReady: (state) => {
      state.status = "READY_FOR_LINK_REQUEST_OR_REDIRECTION";
    },
    backToIdle: (state) => {
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
      state.feedback = { kind: "success" };
    },
    sendModificationLinkFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.status = "ERRORED";
      state.feedback = {
        kind: "errored",
        errorMessage: action.payload,
      };
    },
  },
});
