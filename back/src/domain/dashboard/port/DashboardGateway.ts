import {
  AbsoluteUrl,
  AdminDashboardName,
  AgencyId,
  ConventionId,
} from "shared";

export interface DashboardGateway {
  getDashboardUrl: (
    dashboardName: AdminDashboardName,
    now: Date,
  ) => AbsoluteUrl;
  getAgencyUrl: (id: AgencyId, now: Date) => AbsoluteUrl;
  getConventionStatusUrl: (id: ConventionId, now: Date) => AbsoluteUrl;
}
