import {
  AbsoluteUrl,
  AdminDashboardName,
  AgencyId,
  ConventionId,
  UserId,
} from "shared";
import { DashboardGateway } from "../port/DashboardGateway";

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
    userId: UserId,
    now: Date,
  ): AbsoluteUrl {
    return `http://stubEstablishmentConventionsDashboardUrl/${userId}/${now}`;
  }

  public getEstablishmentDiscussionsDashboardUrl(
    userId: UserId,
    now: Date,
  ): AbsoluteUrl {
    return `http://stubEstablishmentDiscussionsDashboardUrl/${userId}/${now}`;
  }
}
