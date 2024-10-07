import {createSelector} from "@reduxjs/toolkit";
import {RootState} from "src/core-logic/storeConfig/store";

const listUserState =  ({ admin }: RootState) =>
  admin.listUsers

const users = createSelector(listUserState, ({ users }) => users)
const isFetching = createSelector(listUserState, ({ isFetching }) => isFetching)
const query = createSelector(listUserState, ({ query }) => query)

export const listUsersSelectors = {
  users,
  isFetching,
  query,
}