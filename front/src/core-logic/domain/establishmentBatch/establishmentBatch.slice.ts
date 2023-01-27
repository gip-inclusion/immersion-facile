import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ContactMethod,
  FormEstablishmentBatchDto,
  FormEstablishmentDto,
} from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";
import { z } from "zod";

export type CSVBoolean = "1" | "0" | "";
export type CSVOptionalString = string | "";

export type EstablishmentCSVRow = {
  siret: string;
  businessNameCustomized: CSVOptionalString;
  businessName: string;
  businessAddress: string;
  naf_code: string;
  appellations_code: string;
  isEngagedEnterprise: CSVBoolean;
  businessContact_job: string;
  businessContact_email: string;
  businessContact_phone: string;
  businessContact_lastName: string;
  businessContact_firstName: string;
  businessContact_contactMethod: ContactMethod;
  businessContact_copyEmails: string;
  isSearchable: CSVBoolean;
  website: CSVOptionalString;
  additionalInformation: CSVOptionalString;
  fitForDisabledWorkers: CSVBoolean;
};

export type AddFormEstablishmentBatchFeedback = SubmitFeedBack<"success">;
export type FormEstablishmentDtoWithErrors = FormEstablishmentDto & {
  zodErrors: z.ZodIssue[];
};
export type EstablishmentBatchState = {
  isLoading: boolean;
  candidateEstablishments: FormEstablishmentDtoWithErrors[];
  feedback: AddFormEstablishmentBatchFeedback;
};

const initialState: EstablishmentBatchState = {
  isLoading: false,
  feedback: {
    kind: "idle",
  },
  candidateEstablishments: [],
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
