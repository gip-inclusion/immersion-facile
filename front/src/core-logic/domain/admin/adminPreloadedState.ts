import { agencyAdminInitialState } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import { dashboardInitialState } from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";
import { fetchUserInitialState } from "src/core-logic/domain/admin/fetchUser/fetchUser.slice";
import { icUsersAdminInitialState } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { listUsersInitialState } from "src/core-logic/domain/admin/listUsers/listUsers.slice";
import { notificationsInitialState } from "src/core-logic/domain/admin/notifications/notificationsSlice";
import type { RootState } from "src/core-logic/storeConfig/store";
import { apiConsumerInitialState } from "../apiConsumer/apiConsumer.slice";

type AdminState = RootState["admin"];

export const adminPreloadedState = (
  state: Partial<AdminState>,
): AdminState => ({
  dashboardUrls: dashboardInitialState,
  notifications: notificationsInitialState,
  agencyAdmin: agencyAdminInitialState,
  inclusionConnectedUsersAdmin: icUsersAdminInitialState,
  apiConsumer: apiConsumerInitialState,
  listUsers: listUsersInitialState,
  fetchUser: fetchUserInitialState,
  ...state,
});
