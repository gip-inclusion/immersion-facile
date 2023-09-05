import { adminAuthInitialState } from "src/core-logic/domain/admin/adminAuth/adminAuth.slice";
import { agencyAdminInitialState } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import { dashboardInitialState } from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";
import { icUsersAdminInitialState } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { notificationsInitialState } from "src/core-logic/domain/admin/notifications/notificationsSlice";
import { RootState } from "src/core-logic/storeConfig/store";
import { apiConsumerInitialState } from "../apiConsumer/apiConsumer.slice";

type AdminState = RootState["admin"];

export const adminPreloadedState = (
  state: Partial<AdminState>,
): AdminState => ({
  dashboardUrls: dashboardInitialState,
  adminAuth: adminAuthInitialState,
  notifications: notificationsInitialState,
  agencyAdmin: agencyAdminInitialState,
  inclusionConnectedUsersAdmin: icUsersAdminInitialState,
  apiConsumer: apiConsumerInitialState,
  ...state,
});
