import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { AgencyId } from "shared/src/agency/agency.dto";

export interface DashboardGateway {
  getConventionsUrl: () => AbsoluteUrl;
  getAgencyUrl: (id: AgencyId) => AbsoluteUrl;
}
