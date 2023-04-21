import { adminAuthInitialState } from "src/core-logic/domain/admin/adminAuth/adminAuth.slice";
import { agencyAdminInitialState } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import { dashboardInitialState } from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";
import { icUsersAdminInitialState } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { sentEmailInitialState } from "src/core-logic/domain/admin/sentEmails/sentEmails.slice";
import { RootState } from "src/core-logic/storeConfig/store";

type AdminState = RootState["admin"];

export const adminPreloadedState = (
  state: Partial<AdminState>,
): AdminState => ({
  dashboardUrls: dashboardInitialState,
  adminAuth: adminAuthInitialState,
  sentEmails: sentEmailInitialState,
  agencyAdmin: agencyAdminInitialState,
  inclusionConnectedUsersAdmin: icUsersAdminInitialState,
  ...state,
});
