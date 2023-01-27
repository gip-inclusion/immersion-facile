import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FormEstablishmentBatchDto } from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";

export type AddFormEstablishmentBatchFeedback = SubmitFeedBack<"success">;

export type EstablishmentBatchState = {
  isLoading: boolean;
  //stagingEstablishments: FormEstablishmentDto[];
  feedback: AddFormEstablishmentBatchFeedback;
};

const initialState: EstablishmentBatchState = {
  isLoading: false,
  feedback: {
    kind: "idle",
  },
};

export const establishmentBatchSlice = createSlice({
  name: "establishmentBatch",
  initialState,
  reducers: {
    addEstablishmentBatchRequested: (
      state,
      _action: PayloadAction<FormEstablishmentBatchDto>,
    ) => {
      state.isLoading = true;
    },
    addEstablishmentBatchSucceeded: (state) => {
      state.isLoading = false;
      state.feedback = {
        kind: "success",
      };
    },
    addEstablishmentBatchErrored: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = {
        kind: "errored",
        errorMessage: action.payload,
      };
    },
  },
});
