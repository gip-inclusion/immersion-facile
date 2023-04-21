import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  ActiveOrRejectedStatus,
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyRight,
  AuthenticatedUserId,
  InclusionConnectedUser,
  OmitFromExistingKeys,
  RegisterAgencyWithRoleToUserDto,
} from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";

export type AgencySuccessFeedbackKind =
  | "agencyAdded"
  | "agencyUpdated"
  | "usersToReviewFetchSuccess"
  | "agencyRegisterToUserSuccess";

export type AgencySubmitFeedback = SubmitFeedBack<AgencySuccessFeedbackKind>;

type NormalizedInclusionConnectedUser = OmitFromExistingKeys<
  InclusionConnectedUser,
  "agencyRights"
> & {
  agencyRights: Record<AgencyId, AgencyRight>;
};

export type NormalizedInclusionConnectedUserById = Record<
  AuthenticatedUserId,
  NormalizedInclusionConnectedUser
>;

export interface AgencyAdminState {
  agencySearchText: string;
  agencyOptions: AgencyOption[];
  agencyNeedingReviewOptions: AgencyOption[];
  agency: AgencyDto | null;
  agencyNeedingReview: AgencyDto | null;
  inclusionConnectedUsersNeedingReview: NormalizedInclusionConnectedUserById;
  selectedUserId: AuthenticatedUserId | null;

  isSearching: boolean;
  isFetchingAgenciesNeedingReview: boolean;
  isFetchingAgenciesNeedingReviewForUser: boolean;
  isUpdating: boolean;
  isUpdatingUserAgencies: boolean;

  error: string | null;
  feedback: AgencySubmitFeedback;
}

export const agencyAdminInitialState: AgencyAdminState = {
  agencyNeedingReviewOptions: [],
  agencySearchText: "",
  agencyOptions: [],
  agency: null,
  agencyNeedingReview: null,
  inclusionConnectedUsersNeedingReview: {},
  selectedUserId: null,

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
    fetchInclusionConnectedUsersToReviewRequested: (state) => {
      state.isFetchingAgenciesNeedingReviewForUser = true;
    },
    fetchInclusionConnectedUsersToReviewSucceeded: (
      state,
      action: PayloadAction<NormalizedInclusionConnectedUserById>,
    ) => {
      state.isFetchingAgenciesNeedingReviewForUser = false;
      state.inclusionConnectedUsersNeedingReview = action.payload;
      state.feedback.kind = "usersToReviewFetchSuccess";
    },
    fetchInclusionConnectedUsersToReviewFailed: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.isFetchingAgenciesNeedingReviewForUser = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    inclusionConnectedUserSelected: (
      state,
      action: PayloadAction<AuthenticatedUserId | null>,
    ) => {
      state.selectedUserId = action.payload;
    },
    registerAgencyWithRoleToUserRequested: (
      state,
      _action: PayloadAction<RegisterAgencyWithRoleToUserDto>,
    ) => {
      state.isUpdatingUserAgencies = true;
    },
    registerAgencyWithRoleToUserSucceeded: (
      state,
      action: PayloadAction<RegisterAgencyWithRoleToUserDto>,
    ) => {
      const { userId, agencyId, role } = action.payload;
      state.isUpdatingUserAgencies = false;
      state.feedback.kind = "agencyRegisterToUserSuccess";
      state.inclusionConnectedUsersNeedingReview[userId].agencyRights[
        agencyId
      ].role = role;
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
