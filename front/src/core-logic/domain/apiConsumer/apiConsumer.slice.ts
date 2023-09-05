import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ApiConsumer, ApiConsumerJwt, BackOfficeJwt } from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";

type ApiConsumerState = {
  isLoading: boolean;
  feedback: SubmitFeedBack<"success" | "createSuccess">;
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
      _action: PayloadAction<BackOfficeJwt>,
    ) => {
      state.isLoading = true;
    },
    retrieveApiConsumersSucceeded: (
      state,
      action: PayloadAction<ApiConsumer[]>,
    ) => {
      state.isLoading = false;
      state.apiConsumers = action.payload;
      state.feedback = { kind: "success" };
    },
    retrieveApiConsumersFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    saveApiConsumerRequested: (
      state,
      _action: PayloadAction<{
        apiConsumer: ApiConsumer;
        adminToken: BackOfficeJwt;
      }>,
    ) => {
      state.isLoading = true;
    },
    saveApiConsumerSucceeded: (
      state,
      action: PayloadAction<ApiConsumerJwt>,
    ) => {
      state.isLoading = false;
      state.feedback = { kind: "createSuccess" };
      state.lastCreatedToken = action.payload;
    },
    saveApiConsumerFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    clearLastCreatedToken: (state) => {
      state.lastCreatedToken = null;
    },
  },
});
