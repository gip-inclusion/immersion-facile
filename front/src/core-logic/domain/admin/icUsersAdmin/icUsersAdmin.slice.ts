import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { filter } from "ramda";
import {
  AgencyId,
  AgencyRight,
  InclusionConnectedUser,
  OmitFromExistingKeys,
  RejectIcUserRoleForAgencyParams,
  User,
  UserId,
  UserParamsForAgency,
  WithAgencyId,
  WithAgencyIdAndUserId,
  WithUserFilters,
} from "shared";
import { SubmitFeedBack } from "src/core-logic/domain/SubmitFeedback";
import { PayloadActionWithFeedbackTopic } from "../../feedback/feedback.slice";

export type NormalizedInclusionConnectedUser = OmitFromExistingKeys<
  InclusionConnectedUser,
  "agencyRights"
> & {
  agencyRights: Record<AgencyId, AgencyRight>;
};

export type NormalizedIcUserById = Record<
  UserId,
  NormalizedInclusionConnectedUser
>;

type IcUsersAdminFeedbackKind =
  | "usersToReviewFetchSuccess"
  | "agencyRegisterToUserSuccess"
  | "agencyRejectionForUserSuccess"
  | "agencyUsersFetchSuccess";

export type IcUsersAdminFeedback = SubmitFeedBack<IcUsersAdminFeedbackKind>;

export type IcUsersAdminState = {
  icUsersNeedingReview: NormalizedIcUserById;
  agencyUsers: NormalizedIcUserById;
  selectedUser: User | null;
  isUpdatingIcUserAgency: boolean;
  isFetchingAgenciesNeedingReviewForIcUser: boolean;
  isFetchingAgencyUsers: boolean;
  feedback: IcUsersAdminFeedback;
};

export const icUsersAdminInitialState: IcUsersAdminState = {
  icUsersNeedingReview: {},
  agencyUsers: {},
  selectedUser: null,
  isUpdatingIcUserAgency: false,
  isFetchingAgenciesNeedingReviewForIcUser: false,
  isFetchingAgencyUsers: false,
  feedback: { kind: "idle" },
};

export const icUsersAdminSlice = createSlice({
  name: "inclusionConnectedUsersAdmin",
  initialState: icUsersAdminInitialState,
  reducers: {
    inclusionConnectedUserSelected: (
      state,
      action: PayloadAction<User | null>,
    ) => {
      state.selectedUser = action.payload;
      if (state.feedback.kind === "errored")
        state.feedback = { kind: "usersToReviewFetchSuccess" };
    },
    fetchInclusionConnectedUsersToReviewRequested: (
      state,
      _action: PayloadAction<WithUserFilters>,
    ) => {
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
    fetchAgencyUsersRequested: (
      state,
      _action: PayloadAction<WithUserFilters>,
    ) => {
      state.agencyUsers = icUsersAdminInitialState.agencyUsers;
      state.isFetchingAgencyUsers = true;
    },
    fetchAgencyUsersFailed: (state, action: PayloadAction<string>) => {
      state.isFetchingAgencyUsers = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    fetchAgencyUsersSucceeded: (
      state,
      action: PayloadAction<NormalizedIcUserById>,
    ) => {
      state.isFetchingAgencyUsers = false;
      state.agencyUsers = action.payload;
      state.feedback.kind = "agencyUsersFetchSuccess";
    },
    registerAgencyWithRoleToUserRequested: (
      state,
      _action: PayloadAction<UserParamsForAgency>,
    ) => {
      state.isUpdatingIcUserAgency = true;
    },
    registerAgencyWithRoleToUserSucceeded: (
      state,
      action: PayloadAction<UserParamsForAgency>,
    ) => {
      const { userId, agencyId, roles: newRoles } = action.payload;
      state.isUpdatingIcUserAgency = false;
      state.feedback.kind = "agencyRegisterToUserSuccess";
      if (
        !state.icUsersNeedingReview[userId].agencyRights[agencyId].roles.some(
          (role) => newRoles.includes(role),
        )
      ) {
        state.icUsersNeedingReview[userId].agencyRights[agencyId].roles =
          newRoles;
      }
    },
    registerAgencyWithRoleToUserFailed: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.isUpdatingIcUserAgency = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },
    rejectAgencyWithRoleToUserRequested: (
      state,
      _action: PayloadAction<RejectIcUserRoleForAgencyParams>,
    ) => {
      state.isUpdatingIcUserAgency = true;
    },

    rejectAgencyWithRoleToUserSucceeded: (
      state,
      action: PayloadAction<RejectIcUserRoleForAgencyParams>,
    ) => {
      const { userId, agencyId } = action.payload;

      const { [agencyId]: _agency, ...agenciesFiltered } =
        state.icUsersNeedingReview[userId].agencyRights;
      state.isUpdatingIcUserAgency = false;
      state.feedback.kind = "agencyRejectionForUserSuccess";
      state.icUsersNeedingReview[userId].agencyRights = agenciesFiltered;
    },

    rejectAgencyWithRoleToUserFailed: (
      state,
      action: PayloadAction<string>,
    ) => {
      state.isUpdatingIcUserAgency = false;
      state.feedback = { kind: "errored", errorMessage: action.payload };
    },

    createUserOnAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<UserParamsForAgency>,
    ) => {
      state.isUpdatingIcUserAgency = true;
    },

    createUserOnAgencySucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<
        {
          icUser: NormalizedInclusionConnectedUser;
        } & WithAgencyId
      >,
    ) => {
      state.isUpdatingIcUserAgency = false;
      const { id } = action.payload.icUser;

      state.agencyUsers[id] = action.payload.icUser;
    },

    createUserOnAgencyFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isUpdatingIcUserAgency = false;
    },

    updateUserOnAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<UserParamsForAgency>,
    ) => {
      state.isUpdatingIcUserAgency = true;
    },

    updateUserOnAgencySucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<UserParamsForAgency>,
    ) => {
      state.isUpdatingIcUserAgency = false;
      const {
        userId,
        agencyId,
        roles: newRoles,
        email,
        isNotifiedByEmail,
      } = action.payload;
      state.agencyUsers[userId].agencyRights[agencyId].roles = newRoles;
      state.agencyUsers[userId].agencyRights[agencyId].isNotifiedByEmail =
        isNotifiedByEmail;
      state.agencyUsers[userId].email =
        email ?? state.agencyUsers[userId].email;
    },

    updateUserOnAgencyFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isUpdatingIcUserAgency = false;
    },

    removeUserFromAgencyRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic<WithAgencyIdAndUserId>,
    ) => {
      state.isUpdatingIcUserAgency = true;
    },

    removeUserFromAgencySucceeded: (
      state,
      action: PayloadActionWithFeedbackTopic<WithAgencyIdAndUserId>,
    ) => {
      state.isUpdatingIcUserAgency = false;
      state.agencyUsers = filter(
        (agencyUser) => agencyUser.id !== action.payload.userId,
        state.agencyUsers,
      );
    },

    removeUserFromAgencyFailed: (
      state,
      _action: PayloadActionWithFeedbackTopic<{ errorMessage: string }>,
    ) => {
      state.isUpdatingIcUserAgency = false;
    },
  },
});
