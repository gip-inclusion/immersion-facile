import {
  AbsoluteUrl,
  AdminDashboardKind,
  AgencyId,
  ConventionId,
} from "shared";
import { DashboardGateway } from "../../../domain/dashboard/port/DashboardGateway";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class StubDashboardGateway implements DashboardGateway {
  public getAgencyUserUrl(agencyIds: AgencyId[]): AbsoluteUrl {
    logger.warn("Dashboard gateway not implemented, getAgencyUrl method");
    return `http://stubAgencyDashboard/${agencyIds.join("_")}`;
  }

  public getConventionStatusUrl(id: ConventionId): AbsoluteUrl {
    logger.warn(
      "Dashboard gateway not implemented, getConventionStatusUrl method",
    );
    return `http://stubConventionStatusDashboard/${id}`;
  }

  public getDashboardUrl(adminDashboardKind: AdminDashboardKind): AbsoluteUrl {
    logger.warn("Dashboard gateway not implemented, getDashboardUrl method");
    return `http://stubDashboard/${adminDashboardKind}`;
  }

  public getErroredConventionsDashboardUrl(agencyIds: AgencyId[]): AbsoluteUrl {
    logger.warn("Dashboard gateway not implemented, getAgencyUrl method");
    return `http://stubErroredConventionDashboard/${agencyIds.join("_")}`;
  }
}
