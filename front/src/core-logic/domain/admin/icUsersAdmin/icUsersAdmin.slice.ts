import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AgencyId,
  AgencyRight,
  AuthenticatedUserId,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
  OmitFromExistingKeys,
} from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";

type NormalizedInclusionConnectedUser = OmitFromExistingKeys<
  InclusionConnectedUser,
  "agencyRights"
> & {
  agencyRights: Record<AgencyId, AgencyRight>;
};

export type NormalizedIcUserById = Record<
  AuthenticatedUserId,
  NormalizedInclusionConnectedUser
>;

type IcUsersAdminFeedbackKind =
  | "usersToReviewFetchSuccess"
  | "agencyRegisterToUserSuccess";

export type IcUsersAdminFeedback = SubmitFeedBack<IcUsersAdminFeedbackKind>;

export type IcUsersAdminState = {
  icUsersNeedingReview: NormalizedIcUserById;
  selectedUserId: AuthenticatedUserId | null;
  isUpdatingIcUserAgency: boolean;
  isFetchingAgenciesNeedingReviewForIcUser: boolean;
  feedback: IcUsersAdminFeedback;
};

export const icUsersAdminInitialState: IcUsersAdminState = {
  icUsersNeedingReview: {},
  selectedUserId: null,
  isUpdatingIcUserAgency: false,
  isFetchingAgenciesNeedingReviewForIcUser: false,
  feedback: { kind: "idle" },
};

export const icUsersAdminSlice = createSlice({
  name: "inclusionConnectedUsersAdmin",
  initialState: icUsersAdminInitialState,
  reducers: {
    inclusionConnectedUserSelected: (
      state,
      action: PayloadAction<AuthenticatedUserId | null>,
    ) => {
      state.selectedUserId = action.payload;
      if (state.feedback.kind === "errored")
        state.feedback = { kind: "usersToReviewFetchSuccess" };
    },
    fetchInclusionConnectedUsersToReviewRequested: (state) => {
      state.isFetchingAgenciesNeedingReviewForIcUser = true;
    },
    fetchInclusionConnectedUsersToReviewFailed: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.isFetchingAgenciesNeedingReviewForIcUser = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    fetchInclusionConnectedUsersToReviewSucceeded: (
      state,
      action: PayloadAction<NormalizedIcUserById>,
    ) => {
      state.isFetchingAgenciesNeedingReviewForIcUser = false;
      state.icUsersNeedingReview = action.payload;
      state.feedback.kind = "usersToReviewFetchSuccess";
    },
    registerAgencyWithRoleToUserRequested: (
      state,
      _action: PayloadAction<IcUserRoleForAgencyParams>,
    ) => {
      state.isUpdatingIcUserAgency = true;
    },
    registerAgencyWithRoleToUserSucceeded: (
      state,
      action: PayloadAction<IcUserRoleForAgencyParams>,
    ) => {
      const { userId, agencyId, role } = action.payload;
      state.isUpdatingIcUserAgency = false;
      state.feedback.kind = "agencyRegisterToUserSuccess";
      state.icUsersNeedingReview[userId].agencyRights[agencyId].role = role;
    },
    registerAgencyWithRoleToUserFailed: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.isUpdatingIcUserAgency = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
  },
});
