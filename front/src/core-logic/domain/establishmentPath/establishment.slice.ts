import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SiretDto } from "shared";
import { SubmitFeedBack } from "../SubmitFeedback"; // type EstablishmentUiStatus =

type EstablishmentFeedback = SubmitFeedBack<
  "success" | "readyForLinkRequestOrRedirection"
>;

export type EstablishmentState = {
  isLoading: boolean;
  feedback: EstablishmentFeedback;
};

const initialState: EstablishmentState = {
  isLoading: false,
  feedback: {
    kind: "idle",
  },
};

export const establishmentSlice = createSlice({
  name: "establishment",
  initialState,
  reducers: {
    gotReady: (state) => {
      state.feedback = {
        kind: "readyForLinkRequestOrRedirection",
      };
    },
    backToIdle: (state) => {
      state.feedback = {
        kind: "idle",
      };
    },
    sendModificationLinkRequested: (
      state,
      _action: PayloadAction<SiretDto>,
    ) => {
      state.isLoading = true;
    },
    sendModificationLinkSucceeded: (state) => {
      state.isLoading = false;
      state.feedback = { kind: "success" };
    },
    sendModificationLinkFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = {
        kind: "errored",
        errorMessage: action.payload,
      };
    },
  },
});
