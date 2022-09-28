import { AbsoluteUrl } from "shared";
import { DashboardGateway } from "../../../domain/dashboard/port/DashboardGateway";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class NotImplementedDashboardGateway implements DashboardGateway {
  getAgencyUrl(): AbsoluteUrl {
    logger.warn("Dashboard gateway not implemented, getAgencyUrl");
    return "http://notImplementedDashboard";
  }

  getConventionsUrl(): AbsoluteUrl {
    logger.warn("Dashboard gateway not implemented, getConventionUrl");
    return "http://notImplementedDashboard";
  }
}
