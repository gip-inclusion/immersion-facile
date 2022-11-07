import { AbsoluteUrl, DashboardName } from "shared";
import { DashboardGateway } from "../../../domain/dashboard/port/DashboardGateway";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class NotImplementedDashboardGateway implements DashboardGateway {
  getAgencyUrl(): AbsoluteUrl {
    logger.warn("Dashboard gateway not implemented, getAgencyUrl method");
    return "http://notImplementedDashboard";
  }

  getDashboardUrl(dashboardName: DashboardName): AbsoluteUrl {
    logger.warn("Dashboard gateway not implemented, getDashboardUrl method");
    return `http://notImplementedDashboard/${dashboardName}`;
  }
}
