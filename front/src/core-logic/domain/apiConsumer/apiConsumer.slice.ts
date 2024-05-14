import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ApiConsumer, ApiConsumerJwt, InclusionConnectJwt } from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";
import { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/notification/notification.slice";

type ApiConsumerState = {
  isLoading: boolean;
  feedback: SubmitFeedBack<"fetchSuccess" | "createSuccess" | "updateSuccess">;
  apiConsumers: ApiConsumer[];
  lastCreatedToken: ApiConsumerJwt | null;
};

export const apiConsumerInitialState: ApiConsumerState = {
  isLoading: false,
  feedback: { kind: "idle" },
  apiConsumers: [],
  lastCreatedToken: null,
};

export const apiConsumerSlice = createSlice({
  name: "apiConsumer",
  initialState: apiConsumerInitialState,
  reducers: {
    retrieveApiConsumersRequested: (
      state,
      _action: PayloadAction<InclusionConnectJwt>,
    ) => {
      state.isLoading = true;
    },
    retrieveApiConsumersSucceeded: (
      state,
      action: PayloadAction<ApiConsumer[]>,
    ) => {
      state.isLoading = false;
      state.apiConsumers = action.payload;
      state.feedback = { kind: "fetchSuccess" };
    },
    retrieveApiConsumersFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    saveApiConsumerRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        apiConsumer: ApiConsumer;
        adminToken: InclusionConnectJwt;
      }>,
    ) => {
      state.isLoading = true;
    },
    saveApiConsumerSucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<{
        apiConsumerJwt: ApiConsumerJwt;
      }>,
    ) => {
      state.isLoading = false;
      state.lastCreatedToken = action.payload.apiConsumerJwt;
    },
    updateApiConsumerSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic,
    ) => {
      state.isLoading = false;
    },
    saveApiConsumerFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isLoading = false;
    },
    clearLastCreatedToken: (state) => {
      state.lastCreatedToken = null;
    },
    clearFeedbackTriggered: (state) => {
      state.feedback = { kind: "idle" };
    },
  },
});
