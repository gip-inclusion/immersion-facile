import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ApiConsumer } from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";

type ApiConsumerState = {
  isLoading: boolean;
  feedback: SubmitFeedBack<"success">;
  apiConsumers: ApiConsumer[];
};

const initialState: ApiConsumerState = {
  isLoading: false,
  feedback: { kind: "idle" },
  apiConsumers: [],
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
  },
});
