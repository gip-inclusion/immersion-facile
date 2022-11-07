import { AbsoluteUrl, AgencyId, DashboardName } from "shared";

export interface DashboardGateway {
  getDashboardUrl: (dashboardName: DashboardName) => AbsoluteUrl;
  getAgencyUrl: (id: AgencyId) => AbsoluteUrl;
}
