import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "src/core-logic/storeConfig/store";

const fetchUserState = ({ admin }: RootState) => admin.fetchUser;

export const adminFetchUserSelectors = {
  fetchedUser: createSelector(fetchUserState, ({ user }) => user),
  isFetching: createSelector(fetchUserState, ({ isFetching }) => isFetching),
};
