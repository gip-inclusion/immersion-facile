import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  GetUsersFilters,
  UserWithNumberOfAgenciesAndEstablishments,
} from "shared";

type UsersState = {
  users: UserWithNumberOfAgenciesAndEstablishments[];
  isFetching: boolean;
  query: string;
};

export const listUsersInitialState: UsersState = {
  users: [],
  isFetching: false,
  query: "",
};

export const listUsersSlice = createSlice({
  name: "listUsers",
  initialState: listUsersInitialState,
  reducers: {
    queryUpdated: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    fetchUsersRequested: (state, _action: PayloadAction<GetUsersFilters>) => {
      state.isFetching = true;
    },
    fetchUsersSucceeded: (
      state,
      action: PayloadAction<UserWithNumberOfAgenciesAndEstablishments[]>,
    ) => {
      state.users = action.payload;
      state.isFetching = false;
    },
  },
});
