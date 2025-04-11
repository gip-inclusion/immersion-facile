import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  type ConnectedUserJwt,
  type EstablishmentNameAndAdmins,
  type FormEstablishmentDto,
  type SiretDto,
  defaultMaxContactsPerMonth,
  emptyAppellationAndRome,
} from "shared";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";

export type EstablishmentUpdatePayload = {
  formEstablishment: FormEstablishmentDto;
  jwt: ConnectedUserJwt;
};

export type EstablishmentDeletePayload = {
  siret: SiretDto;
  jwt: ConnectedUserJwt;
};

export type SiretAndJwtPayload = {
  siret: SiretDto;
  jwt: ConnectedUserJwt;
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
  userRights: [],
  contactMethod: "EMAIL",
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
  establishmentNameAndAdmins:
    | EstablishmentNameAndAdmins
    | null
    | "establishmentNotFound";
};

const initialState: EstablishmentState = {
  isLoading: false,
  isReadyForRedirection: false,
  formEstablishment: defaultFormEstablishmentValue(),
  establishmentNameAndAdmins: null,
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
        jwt: ConnectedUserJwt;
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
      action: PayloadActionWithFeedbackTopic<{
        establishmentUpdate: EstablishmentUpdatePayload;
      }>,
    ) => {
      state.isLoading = false;
      state.formEstablishment =
        action.payload.establishmentUpdate.formEstablishment;
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
    },
    deleteEstablishmentFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },

    fetchEstablishmentNameAndAdminsRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<SiretAndJwtPayload>,
    ) => {
      state.isLoading = true;
      state.establishmentNameAndAdmins = null;
    },
    fetchEstablishmentNameAndAdminSucceded: (
      state,
      action: PayloadActionWithFeedbackTopic<{
        establishmentNameAndAdmins:
          | EstablishmentNameAndAdmins
          | "establishmentNotFound";
      }>,
    ) => {
      state.isLoading = false;
      state.establishmentNameAndAdmins =
        action.payload.establishmentNameAndAdmins;
    },
    fetchEstablishmentNameAndAdminsFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },

    clearEstablishmentRequested: () => initialState,
  },
});
