import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { InclusionConnectedUser, UserId } from "shared";
import { updateUserAgencyRights } from "src/core-logic/domain/agencies/agencies.helpers";
import { updateUserOnAgencySlice } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";

type FetchUserState = {
  user: InclusionConnectedUser | null;
  isFetching: boolean;
};

export const fetchUserInitialState: FetchUserState = {
  user: null,
  isFetching: false,
};

export const fetchUserSlice = createSlice({
  name: "fetchUser",
  initialState: fetchUserInitialState,
  reducers: {
    fetchUserRequested: (state, _action: PayloadAction<{ userId: UserId }>) => {
      state.isFetching = true;
    },
    fetchUserSucceeded: (
      state,
      action: PayloadAction<InclusionConnectedUser>,
    ) => {
      state.user = action.payload;
      state.isFetching = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      updateUserOnAgencySlice.actions.updateUserAgencyRightSucceeded,
      (state, action) => {
        if (!state.user) return;
        state.user = updateUserAgencyRights(state.user, action.payload);
      },
    );
  },
});
