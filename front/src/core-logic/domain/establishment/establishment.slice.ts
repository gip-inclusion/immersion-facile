import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  EstablishmentJwt,
  FormEstablishmentDto,
  InclusionConnectJwt,
  SiretDto,
  defaultMaxContactsPerMonth,
} from "shared";
import { emptyAppellationAndRome } from "shared";
import {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export type EstablishmentUpdatePayload = {
  formEstablishment: FormEstablishmentDto;
  jwt: EstablishmentJwt | InclusionConnectJwt;
};

export type EstablishmentDeletePayload = {
  siret: SiretDto;
  jwt: InclusionConnectJwt;
};

export type SiretAndJwtPayload = {
  siret: SiretDto;
  jwt: EstablishmentJwt | InclusionConnectJwt;
};

export type EstablishmentRequestedPayload =
  | Partial<FormEstablishmentDto>
  | SiretAndJwtPayload;

export const defaultFormEstablishmentValue = (
  siret?: SiretDto,
): FormEstablishmentDto => ({
  source: "immersion-facile",
  siret: siret || "",
  businessName: "",
  businessAddresses: [],
  appellations: [emptyAppellationAndRome],
  businessContact: {
    firstName: "",
    lastName: "",
    job: "",
    phone: "",
    email: "",
    contactMethod: "EMAIL",
    copyEmails: [],
  },
  website: "",
  additionalInformation: "",
  maxContactsPerMonth: defaultMaxContactsPerMonth,
  naf: undefined,
  isEngagedEnterprise: undefined,
  fitForDisabledWorkers: false,
  businessNameCustomized: undefined,
  searchableBy: {
    jobSeekers: true,
    students: true,
  },
});

export type EstablishmentState = {
  isLoading: boolean;
  isReadyForRedirection: boolean;
  formEstablishment: FormEstablishmentDto;
};

const initialState: EstablishmentState = {
  isLoading: false,
  isReadyForRedirection: false,
  formEstablishment: defaultFormEstablishmentValue(),
};

export const establishmentSlice = createSlice({
  name: "establishment",
  initialState,
  reducers: {
    gotReady: (state) => {
      state.isReadyForRedirection = true;
    },
    backToIdle: (state) => {
      state.isReadyForRedirection = false;
    },
    fetchEstablishmentRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        establishmentRequested: EstablishmentRequestedPayload;
      }>,
    ) => {
      state.isLoading = true;
    },
    fetchEstablishmentSucceeded: (
      state,
      action: PayloadAction<FormEstablishmentDto>,
    ) => {
      state.formEstablishment = action.payload;
      state.isLoading = false;
    },
    fetchEstablishmentFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },

    createEstablishmentRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        formEstablishment: FormEstablishmentDto;
      }>,
    ) => {
      state.isLoading = true;
    },
    createEstablishmentSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic,
    ) => {
      state.isLoading = false;
    },
    createEstablishmentFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },

    updateEstablishmentRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        establishmentUpdate: EstablishmentUpdatePayload;
      }>,
    ) => {
      state.isLoading = true;
    },
    updateEstablishmentSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic,
    ) => {
      state.isLoading = false;
    },
    updateEstablishmentFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },

    deleteEstablishmentRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        establishmentDelete: EstablishmentDeletePayload;
      }>,
    ) => {
      state.isLoading = true;
    },
    deleteEstablishmentSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic,
    ) => {
      state.isLoading = false;
      // state.feedback = { kind: "deleteSuccess" };
    },
    deleteEstablishmentFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
      // state.feedback = {
      //   kind: "deleteErrored",
      // };
    },

    clearEstablishmentRequested: () => initialState,

    sendModificationLinkRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        siret: SiretDto;
      }>,
    ) => {
      state.isLoading = true;
    },
    sendModificationLinkSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<{
        siret: SiretDto;
      }>,
    ) => {
      state.isLoading = false;
    },
    sendModificationLinkFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
});
