import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ApiConsumer, ApiConsumerJwt, InclusionConnectJwt } from "shared";
import { PayloadActionWithFeedbackTopic } from "src/core-logic/domain/notification/notification.slice";

type ApiConsumerState = {
  isLoading: boolean;
  apiConsumers: ApiConsumer[];
  lastCreatedToken: ApiConsumerJwt | null;
};

export const apiConsumerInitialState: ApiConsumerState = {
  isLoading: false,
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
    },
    retrieveApiConsumersFailed: (state) => {
      state.isLoading = false;
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
  },
});
