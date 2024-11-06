import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { InclusionConnectedUser, UserId } from "shared";

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
});