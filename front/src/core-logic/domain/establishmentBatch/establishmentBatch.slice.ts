import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  FormEstablishmentDto,
} from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";
import type { z } from "zod/v4";

export type FormEstablishmentDtoWithErrors = {
  formEstablishment: FormEstablishmentDto | null;
  zodErrors: z.ZodIssue[];
};
export type EstablishmentBatchState = {
  isLoading: boolean;
  candidateEstablishments: FormEstablishmentDtoWithErrors[];
  addBatchResponse: EstablishmentBatchReport | null;
};

const initialState: EstablishmentBatchState = {
  isLoading: false,
  candidateEstablishments: [],
  addBatchResponse: null,
};

export const establishmentBatchSlice = createSlice({
  name: "establishmentBatch",
  initialState,
  reducers: {
    candidateEstablishmentBatchProvided: (
      _state,
      _action: PayloadAction<unknown[]>,
    ) => initialState,
    candidateEstablishmentBatchParsed: (
      state,
      action: PayloadAction<FormEstablishmentDtoWithErrors[]>,
    ) => {
      state.candidateEstablishments = action.payload;
    },
    addEstablishmentBatchRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        formEstablishmentBatch: FormEstablishmentBatchDto;
      }>,
    ) => {
      state.isLoading = true;
    },
    addEstablishmentBatchSucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<{
        establishmentBatchReport: EstablishmentBatchReport;
      }>,
    ) => {
      state.isLoading = false;
      state.addBatchResponse = action.payload.establishmentBatchReport;
    },
    addEstablishmentBatchErrored: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
});
