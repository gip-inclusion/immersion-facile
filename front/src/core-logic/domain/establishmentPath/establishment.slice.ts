import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  BackOfficeJwt,
  defaultMaxContactsPerWeek,
  EstablishmentJwt,
  FormEstablishmentDto,
  SiretDto,
} from "shared";
import { emptyAppellationAndRome } from "shared";
import { SubmitFeedBack } from "../SubmitFeedback"; // type EstablishmentUiStatus =

type EstablishmentFeedback = SubmitFeedBack<
  | "success"
  | "readyForLinkRequestOrRedirection"
  | "submitSuccess"
  | "submitErrored"
  | "sendModificationLinkSuccess"
  | "sendModificationLinkErrored"
  | "deleteSuccess"
  | "deleteErrored"
>;

export type EstablishmentUpdatePayload = {
  formEstablishment: FormEstablishmentDto;
  jwt: EstablishmentJwt | BackOfficeJwt;
};

export type EstablishmentDeletePayload = {
  siret: SiretDto;
  jwt: BackOfficeJwt;
};

export type EstablishmentRequestedPayload =
  | Partial<FormEstablishmentDto>
  | {
      siret: SiretDto;
      jwt: EstablishmentJwt | BackOfficeJwt;
    };

export const defaultFormEstablishmentValue = (
  siret?: SiretDto,
): FormEstablishmentDto => ({
  source: "immersion-facile",
  siret: siret || "",
  businessName: "",
  businessAddress: "",
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
  maxContactsPerWeek: defaultMaxContactsPerWeek,
  naf: undefined,
  isEngagedEnterprise: undefined,
  fitForDisabledWorkers: undefined,
  businessNameCustomized: undefined,
});

export type EstablishmentState = {
  isLoading: boolean;
  feedback: EstablishmentFeedback;
  formEstablishment: FormEstablishmentDto;
};

const initialState: EstablishmentState = {
  isLoading: false,
  feedback: {
    kind: "idle",
  },
  formEstablishment: defaultFormEstablishmentValue(),
};

export const establishmentSlice = createSlice({
  name: "establishment",
  initialState,
  reducers: {
    gotReady: (state) => {
      state.feedback = {
        kind: "readyForLinkRequestOrRedirection",
      };
    },
    backToIdle: (state) => {
      state.feedback = {
        kind: "idle",
      };
    },
    establishmentRequested: (
      state,
      _action: PayloadAction<EstablishmentRequestedPayload>,
    ) => {
      state.isLoading = true;
    },
    establishmentProvided: (
      state,
      action: PayloadAction<FormEstablishmentDto>,
    ) => {
      state.formEstablishment = action.payload;
      state.isLoading = false;
      state.feedback = { kind: "success" };
    },
    establishmentProvideFailed: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = {
        kind: "errored",
        errorMessage: action.payload,
      };
    },

    establishmentCreationRequested: (
      state,
      _action: PayloadAction<FormEstablishmentDto>,
    ) => {
      state.isLoading = true;
    },
    establishmentCreationSucceeded: (state) => {
      state.isLoading = false;
      state.feedback = { kind: "submitSuccess" };
    },
    establishmentCreationFailed: (state, _action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = {
        kind: "submitErrored",
      };
    },

    establishmentEditionRequested: (
      state,
      _action: PayloadAction<EstablishmentUpdatePayload>,
    ) => {
      state.isLoading = true;
    },
    establishmentEditionSucceeded: (state) => {
      state.isLoading = false;
      state.feedback = { kind: "submitSuccess" };
    },
    establishmentEditionFailed: (state, _action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = {
        kind: "submitErrored",
      };
    },

    establishmentDeletionRequested: (
      state,
      _action: PayloadAction<EstablishmentDeletePayload>,
    ) => {
      state.isLoading = true;
    },
    establishmentDeletionSucceeded: (state) => {
      state.isLoading = false;
      state.feedback = { kind: "deleteSuccess" };
    },
    establishmentDeletionFailed: (state, _action: PayloadAction<string>) => {
      state.isLoading = false;
      state.feedback = {
        kind: "deleteErrored",
      };
    },

    establishmentClearRequested: () => initialState,

    sendModificationLinkRequested: (
      state,
      _action: PayloadAction<SiretDto>,
    ) => {
      state.isLoading = true;
    },
    sendModificationLinkSucceeded: (state) => {
      state.isLoading = false;
      state.feedback = { kind: "sendModificationLinkSuccess" };
    },
    sendModificationLinkFailed: (state) => {
      state.isLoading = false;
      state.feedback = {
        kind: "sendModificationLinkErrored",
      };
    },
  },
});
