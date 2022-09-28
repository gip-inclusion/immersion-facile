import { AbsoluteUrl } from "shared";
import { AgencyId } from "shared";

export interface DashboardGateway {
  getConventionsUrl: () => AbsoluteUrl;
  getAgencyUrl: (id: AgencyId) => AbsoluteUrl;
}
