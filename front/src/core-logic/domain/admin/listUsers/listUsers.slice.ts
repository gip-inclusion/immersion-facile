import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "shared";

type UsersState = {
  users: User[];
  isFetching: boolean;
  query: string;
};

export const listUsersInitialState: UsersState = {
  users: [],
  isFetching: false,
  query: "",
};

export type UserFilters = {
  emailContains: string;
};

export const listUsersSlice = createSlice({
  name: "listUsers",
  initialState: listUsersInitialState,
  reducers: {
    queryUpdated: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    fetchUsersRequested: (state, _action: PayloadAction<UserFilters>) => {
      state.isFetching = true;
    },
    fetchUsersSucceeded: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
      state.isFetching = false;
    },
  },
});
