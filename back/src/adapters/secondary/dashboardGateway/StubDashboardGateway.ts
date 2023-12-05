import {
  AbsoluteUrl,
  AdminDashboardName,
  AgencyId,
  AuthenticatedUserId,
  ConventionId,
} from "shared";
import { DashboardGateway } from "../../../domain/dashboard/port/DashboardGateway";

export class StubDashboardGateway implements DashboardGateway {
  public getAgencyUserUrl(agencyIds: AgencyId[]): AbsoluteUrl {
    return `http://stubAgencyDashboard/${agencyIds.join("_")}`;
  }

  public getConventionStatusUrl(id: ConventionId): AbsoluteUrl {
    return `http://stubConventionStatusDashboard/${id}`;
  }

  public getDashboardUrl(adminDashboardKind: AdminDashboardName): AbsoluteUrl {
    return `http://stubDashboard/${adminDashboardKind}`;
  }

  public getErroredConventionsDashboardUrl(agencyIds: AgencyId[]): AbsoluteUrl {
    return `http://stubErroredConventionDashboard/${agencyIds.join("_")}`;
  }

  public getEstablishmentConventionsDashboardUrl(
    authenticatedUserId: AuthenticatedUserId,
    now: Date,
  ): AbsoluteUrl {
    return `http://stubEstablishmentConventionsDashboardUrl/${authenticatedUserId}/${now}`;
  }
}
