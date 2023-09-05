import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ApiConsumer, ApiConsumerJwt } from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";

type ApiConsumerState = {
  isLoading: boolean;
  feedback: SubmitFeedBack<"success" | "createSuccess">;
  apiConsumers: ApiConsumer[];
  lastCreatedToken: ApiConsumerJwt | null;
};

const initialState: ApiConsumerState = {
  isLoading: false,
  feedback: { kind: "idle" },
  apiConsumers: [],
  lastCreatedToken: null,
};

export const apiConsumerSlice = createSlice({
  name: "apiConsumer",
  initialState,
  reducers: {
    retrieveApiConsumersRequested: (state) => {
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
    saveApiConsumerRequested: (state, _action: PayloadAction<ApiConsumer>) => {
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
