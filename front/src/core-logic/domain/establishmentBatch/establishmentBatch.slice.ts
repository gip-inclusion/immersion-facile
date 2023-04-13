import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";

import {
  EstablishmentBatchReport,
  EstablishmentCSVRow,
  FormEstablishmentBatchDto,
  FormEstablishmentDto,
} from "shared";

import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";

export type AddFormEstablishmentBatchFeedback = SubmitFeedBack<"success">;
export type FormEstablishmentDtoWithErrors = FormEstablishmentDto & {
  zodErrors: z.ZodIssue[];
};
export type EstablishmentBatchState = {
  isLoading: boolean;
  candidateEstablishments: FormEstablishmentDtoWithErrors[];
  feedback: AddFormEstablishmentBatchFeedback;
  addBatchResponse: EstablishmentBatchReport | null;
};

const initialState: EstablishmentBatchState = {
  isLoading: false,
  feedback: {
    kind: "idle",
  },
  candidateEstablishments: [],
  addBatchResponse: null,
};

export const establishmentBatchSlice = createSlice({
  name: "establishmentBatch",
  initialState,
  reducers: {
    candidateEstablishmentBatchProvided: (
      _state,
      _action: PayloadAction<EstablishmentCSVRow[]>,
    ) => initialState,
    candidateEstablishmentBatchParsed: (
      state,
      action: PayloadAction<FormEstablishmentDtoWithErrors[]>,
    ) => {
      state.candidateEstablishments = action.payload;
    },
    addEstablishmentBatchRequested: (
      state,
      _action: PayloadAction<FormEstablishmentBatchDto>,
    ) => {
      state.isLoading = true;
    },
    addEstablishmentBatchSucceeded: (
      state,
      action: PayloadAction<EstablishmentBatchReport>,
    ) => {
      state.isLoading = false;
      state.feedback = {
        kind: "success",
      };
      state.addBatchResponse = action.payload;
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
