import {
  AbsoluteUrl,
  AgencyId,
  ConventionId,
  AdminDashboardName,
} from "shared";

export interface DashboardGateway {
  getDashboardUrl: (dashboardName: AdminDashboardName) => AbsoluteUrl;
  getAgencyUrl: (id: AgencyId) => AbsoluteUrl;
  getConventionStatusUrl: (id: ConventionId) => AbsoluteUrl;
}
