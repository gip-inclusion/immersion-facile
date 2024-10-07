import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "shared";

type UsersState = {
  users: User[];
  isFetching: boolean;
  query: string;
};

const initialState: UsersState = {
  users: [],
  isFetching: false,
  query: "",
};

type UserFilters = {
  emailContains: string;
};

export const listUsersSlice = createSlice({
  name: "listUsers",
  initialState,
  reducers: {
    queryUpdated: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    fetchUsersRequested: (_, _action: PayloadAction<UserFilters>) => {
      // TODO isFetching = true;
    },
    fetchUsersSucceeded: (state, action: PayloadAction<User[]>) => {
      // TODO state.users = action.payload;
      //   isFetching = false;
    },
    fetchusersFailed: (state, action) => {
      // TODO
      // isFetching = false;
    },
  },
});
