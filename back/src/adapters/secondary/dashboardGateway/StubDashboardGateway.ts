import { AbsoluteUrl, AgencyId, DashboardName } from "shared";
import { DashboardGateway } from "../../../domain/dashboard/port/DashboardGateway";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class StubDashboardGateway implements DashboardGateway {
  getAgencyUrl(id: AgencyId): AbsoluteUrl {
    logger.warn("Dashboard gateway not implemented, getAgencyUrl method");
    return `http://notImplementedAgencyDashboard/${id as string}`;
  }

  getDashboardUrl(dashboardName: DashboardName): AbsoluteUrl {
    logger.warn("Dashboard gateway not implemented, getDashboardUrl method");
    return `http://notImplementedDashboard/${dashboardName}`;
  }
}
