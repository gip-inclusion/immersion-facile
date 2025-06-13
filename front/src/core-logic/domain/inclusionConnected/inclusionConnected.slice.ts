import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type {
  AgencyDto,
  FormEstablishmentDto,
  FormEstablishmentUserRight,
  InclusionConnectedUser,
  WithAgencyIds,
  WithEstablishmentData,
} from "shared";
import { updateUserAgencyRights } from "src/core-logic/domain/agencies/agencies.helpers";
import { removeUserFromAgencySlice } from "src/core-logic/domain/agencies/remove-user-from-agency/removeUserFromAgency.slice";
import { updateUserOnAgencySlice } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";
import {
  type EstablishmentUpdatePayload,
  establishmentSlice,
} from "src/core-logic/domain/establishment/establishment.slice";
import type {
  PayloadActionWithFeedbackTopic,
  PayloadActionWithFeedbackTopicError,
} from "src/core-logic/domain/feedback/feedback.slice";
import { authSlice } from "../auth/auth.slice";

type InclusionConnectedState = {
  currentUser: InclusionConnectedUser | null;
  isLoading: boolean;
  agenciesToReview: AgencyDto[];
};

const initialState: InclusionConnectedState = {
  currentUser: null,
  isLoading: false,
  agenciesToReview: [],
};

export const inclusionConnectedSlice = createSlice({
  name: "inclusionConnected",
  initialState,
  reducers: {
    currentUserFetchRequested: (
      state,
      _action: PayloadActionWithFeedbackTopic,
    ) => {
      state.isLoading = true;
    },
    currentUserFetchSucceeded: (
      state,
      action: PayloadAction<InclusionConnectedUser>,
    ) => {
      state.isLoading = false;
      state.currentUser = action.payload;
    },
    currentUserFetchFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
    registerAgenciesRequested: (
      state,
      _payload: PayloadActionWithFeedbackTopic<WithAgencyIds>,
    ) => {
      state.isLoading = true;
    },
    registerAgenciesSucceeded: (
      state,
      _action: PayloadActionWithFeedbackTopic<WithAgencyIds>,
    ) => {
      state.isLoading = false;
      //state.feedback = { kind: "agencyRegistrationSuccess" };
    },
    registerAgenciesFailed: (
      state,
      _action: PayloadActionWithFeedbackTopicError,
    ) => {
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(authSlice.actions.logOutFromProviderSucceeded, (state) => {
      state.currentUser = null;
    });

    builder.addCase(
      establishmentSlice.actions.updateEstablishmentSucceeded,
      (state, action) => {
        if (!state.currentUser) return;
        state.currentUser.establishments =
          updateUserRightsOnUpdatedEstablishment(
            state.currentUser,
            action.payload.establishmentUpdate,
          );
      },
    );

    builder.addCase(
      updateUserOnAgencySlice.actions.updateUserAgencyRightSucceeded,
      (state, action) => {
        if (
          !state.currentUser ||
          state.currentUser.id !== action.payload.userId
        )
          return;
        state.currentUser = updateUserAgencyRights(
          state.currentUser,
          action.payload,
        );
      },
    );
    builder.addCase(
      removeUserFromAgencySlice.actions.removeUserFromAgencySucceeded,
      (state, action) => {
        if (
          !state.currentUser ||
          state.currentUser.id !== action.payload.userId
        )
          return;

        state.currentUser.agencyRights = state.currentUser.agencyRights.filter(
          (right) => right.agency.id !== action.payload.agencyId,
        );
      },
    );
  },
});

const updateUserRightsOnUpdatedEstablishment = (
  user: InclusionConnectedUser,
  establishment: EstablishmentUpdatePayload,
): InclusionConnectedUser["establishments"] => {
  if (!user || !user.establishments) return;
  const { siret, userRights: formEstablishmentUserRights } =
    establishment.formEstablishment;
  const currentUserRightsOnEstablishment = formEstablishmentUserRights.find(
    (right) => right.email === user.email,
  );
  const otherEstablishmentUserRights = user.establishments.filter(
    (right) => right.siret !== siret,
  );

  if (!currentUserRightsOnEstablishment) return otherEstablishmentUserRights;

  const establishmentAdmins = user.establishments.find(
    (establishment) => establishment.siret === siret,
  )?.admins;

  if (!establishmentAdmins) return;

  const updatedUserRightsOnEstablishment: WithEstablishmentData[] =
    formEstablishmentUserRights
      .filter((right) => right.email === user.email)
      .map((right) =>
        formEstablishmentUserRightToWithEstablishmentData(
          establishment.formEstablishment,
          right,
          establishmentAdmins,
        ),
      );

  return [...otherEstablishmentUserRights, ...updatedUserRightsOnEstablishment];
};

const formEstablishmentUserRightToWithEstablishmentData = (
  establishment: FormEstablishmentDto,
  userRight: FormEstablishmentUserRight,
  admins: WithEstablishmentData["admins"],
): WithEstablishmentData => {
  return {
    siret: establishment.siret,
    businessName: establishment.businessName,
    admins,
    role: userRight.role,
  };
};
