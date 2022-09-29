import { AbsoluteUrl, AgencyId } from "shared";

export interface DashboardGateway {
  getConventionsUrl: () => AbsoluteUrl;
  getAgencyUrl: (id: AgencyId) => AbsoluteUrl;
}
