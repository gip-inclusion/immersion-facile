import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ActiveOrRejectedStatus,
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyRole,
  AuthenticatedUser,
  AuthenticatedUserId,
} from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";

export type AgencySuccessFeedbackKind =
  | "agencyAdded"
  | "agencyUpdated"
  | "agenciesToReviewForUserFetchSuccess"
  | "usersToReviewFetchSuccess"
  | "agencyRegisterToUserSuccess";
export type AgencySubmitFeedback = SubmitFeedBack<AgencySuccessFeedbackKind>;

export interface AgencyAdminState {
  agencySearchText: string;
  agencyOptions: AgencyOption[];
  agencyNeedingReviewOptions: AgencyOption[];
  agency: AgencyDto | null;
  agencyNeedingReview: AgencyDto | null;
  agenciesNeedingReviewForUser: AgencyDto[];
  usersNeedingReview: AuthenticatedUser[];

  isSearching: boolean;
  isFetchingAgenciesNeedingReview: boolean;
  isFetchingAgenciesNeedingReviewForUser: boolean;
  isUpdating: boolean;
  isUpdatingUserAgencies: boolean;

  error: string | null;
  feedback: AgencySubmitFeedback;
}

export type RegisterAgencyWithRoleToUserPayload = {
  agencyId: AgencyId;
  role: AgencyRole;
  userId: AuthenticatedUserId;
};

export const agencyAdminInitialState: AgencyAdminState = {
  agencyNeedingReviewOptions: [],
  agencySearchText: "",
  agencyOptions: [],
  agency: null,
  agencyNeedingReview: null,
  agenciesNeedingReviewForUser: [],
  usersNeedingReview: [],

  isSearching: false,
  isFetchingAgenciesNeedingReview: false,
  isUpdating: false,
  isFetchingAgenciesNeedingReviewForUser: false,
  isUpdatingUserAgencies: false,

  feedback: { kind: "idle" },
  error: null,
};

export const agencyAdminSlice = createSlice({
  name: "agencyAdmin",
  initialState: agencyAdminInitialState,
  reducers: {
    fetchAgenciesNeedingReviewRequested: (state) => {
      state.isFetchingAgenciesNeedingReview = true;
      state.agencyNeedingReviewOptions = [];
    },
    setAgencySearchText: (state, action: PayloadAction<string>) => {
      state.agencySearchText = action.payload;
      state.isSearching = true;
    },
    setAgencyOptions: (state, action: PayloadAction<AgencyOption[]>) => {
      state.agencyOptions = action.payload;
      state.isSearching = false;
      state.isFetchingAgenciesNeedingReview = false;
    },
    setAgencyNeedingReviewOptions: (
      state,
      action: PayloadAction<AgencyOption[]>,
    ) => {
      state.agencyNeedingReviewOptions = action.payload;
      state.isFetchingAgenciesNeedingReview = false;
    },
    setSelectedAgencyId: (state, _action: PayloadAction<AgencyId>) => {
      state.feedback = { kind: "idle" };
      state.agency = null;
    },
    setSelectedAgencyNeedingReviewId: (
      state,
      _action: PayloadAction<AgencyId>,
    ) => {
      state.feedback = { kind: "idle" };
      state.agency = null;
    },
    setAgency: (state, action: PayloadAction<AgencyDto | null>) => {
      state.agency = action.payload ?? null;
    },
    setAgencyNeedingReview: (
      state,
      action: PayloadAction<AgencyDto | null>,
    ) => {
      state.agencyNeedingReview = action.payload ?? null;
    },
    fetchAgenciesNeedingReviewFailed: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.isFetchingAgenciesNeedingReview = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    updateAgencyRequested: (state, _action: PayloadAction<AgencyDto>) => {
      state.isUpdating = true;
      state.feedback = { kind: "idle" };
    },
    updateAgencySucceeded: (state, _action: PayloadAction<AgencyDto>) => {
      state.isUpdating = false;
      state.feedback = { kind: "agencyUpdated" };
    },
    updateAgencyNeedingReviewStatusRequested: (
      state,
      _action: PayloadAction<{ id: AgencyId; status: ActiveOrRejectedStatus }>,
    ) => {
      state.isUpdating = true;
      state.feedback = { kind: "idle" };
    },
    updateAgencyNeedingReviewStatusSucceeded: (
      state,
      _action: PayloadAction<AgencyId>,
    ) => {
      state.isUpdating = false;
      state.feedback = { kind: "agencyUpdated" };
    },
    updateAgencyFailed: (state, action: PayloadAction<string>) => {
      state.isUpdating = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    updateAgencyStatusFailed: (state, action: PayloadAction<string>) => {
      state.isUpdating = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    agencyNeedingReviewChangedAfterAnUpdate: (
      state,
      action: PayloadAction<{
        agencyNeedingReviewOptions: AgencyOption[];
        agencyNeedingReview: AgencyDto | null;
      }>,
    ) => {
      state.agencyNeedingReviewOptions =
        action.payload.agencyNeedingReviewOptions;
      state.agencyNeedingReview = action.payload.agencyNeedingReview;
    },
    fetchAgencyUsersToReviewRequested: (state) => {
      state.isFetchingAgenciesNeedingReviewForUser = true;
    },
    fetchAgencyUsersToReviewSucceeded: (
      state,
      action: PayloadAction<AuthenticatedUser[]>,
    ) => {
      state.isFetchingAgenciesNeedingReviewForUser = false;
      state.usersNeedingReview = action.payload;
      state.feedback.kind = "usersToReviewFetchSuccess";
    },
    fetchAgencyUsersToReviewFailed: (state, action: PayloadAction<string>) => {
      state.isFetchingAgenciesNeedingReviewForUser = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    fetchAgenciesToReviewForUserRequested: (
      state,
      _action: PayloadAction<AuthenticatedUserId>,
    ) => {
      state.isFetchingAgenciesNeedingReviewForUser = true;
    },
    fetchAgenciesToReviewForUserSucceeded: (
      state,
      action: PayloadAction<AgencyDto[]>,
    ) => {
      state.isFetchingAgenciesNeedingReviewForUser = false;
      state.agenciesNeedingReviewForUser = action.payload;
      state.feedback.kind = "agenciesToReviewForUserFetchSuccess";
    },
    fetchAgenciesToReviewForUserFailed: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.isFetchingAgenciesNeedingReviewForUser = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    registerAgencyWithRoleToUserRequested: (
      state,
      _action: PayloadAction<RegisterAgencyWithRoleToUserPayload>,
    ) => {
      state.isUpdatingUserAgencies = true;
    },
    registerAgencyWithRoleToUserSucceeded: (
      state,
      action: PayloadAction<AgencyId>,
    ) => {
      state.isUpdatingUserAgencies = false;
      state.agenciesNeedingReviewForUser =
        state.agenciesNeedingReviewForUser.filter(
          (agency) => agency.id !== action.payload,
        );
      state.feedback.kind = "agencyRegisterToUserSuccess";
    },
    registerAgencyWithRoleToUserFailed: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.isUpdatingUserAgencies = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
  },
});
