import {
  AbsoluteUrl,
  AdminDashboardName,
  AgencyId,
  ConventionId,
  UserId,
} from "shared";
import { DashboardGateway } from "../port/DashboardGateway";

export class StubDashboardGateway implements DashboardGateway {
  getAgencyUserUrl(
    userId: UserId,
    now: Date,
  ): `http://${string}` | `https://${string}` {
    return `http://stubAgencyUserDashboard/${userId}/${now}`;
  }
  getAgencyForAdminUrl(
    agencyId: AgencyId,
    now: Date,
  ): `http://${string}` | `https://${string}` {
    return `http://stubAgencyForAdminDashboard/${agencyId}/${now}`;
  }
  getErroredConventionsDashboardUrl(
    userId: UserId,
    now: Date,
  ): `http://${string}` | `https://${string}` {
    return `http://stubErroredConventionDashboard/${userId}/${now}`;
  }

  public getConventionStatusUrl(id: ConventionId, now: Date): AbsoluteUrl {
    return `http://stubConventionStatusDashboard/${id}/${now}`;
  }

  public getDashboardUrl(
    adminDashboardKind: AdminDashboardName,
    now: Date,
  ): AbsoluteUrl {
    return `http://stubDashboard/${adminDashboardKind}/${now}`;
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
