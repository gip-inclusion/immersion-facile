import type {
  AbsoluteUrl,
  AdminDashboardName,
  AgencyDashboards,
  AgencyId,
  ConventionId,
  OmitFromExistingKeys,
  UserId,
} from "shared";
import type { DashboardGateway } from "../port/DashboardGateway";

export class StubDashboardGateway implements DashboardGateway {
  getAgencyUserUrls(
    userId: UserId,
    now: Date,
  ): OmitFromExistingKeys<AgencyDashboards, "erroredConventionsDashboardUrl"> {
    return {
      agencyDashboardUrl: `http://stubAgencyUserDashboard/${userId}/${now}`,
      statsEstablishmentDetailsUrl: `http://stubStatsEstablishmentDetailsDashboard/${now}`,
      statsConventionsByEstablishmentByDepartmentUrl: `http://stubStatsConventionsByEstablishmentByDepartmentDashboard/${now}`,
      statsAgenciesUrl: `http://stubStatsAgenciesDashboard/${now}`,
    };
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

  public getAdminDashboardUrl(
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
