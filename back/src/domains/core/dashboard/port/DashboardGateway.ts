import {
  AbsoluteUrl,
  AdminDashboardName,
  AgencyId,
  ConventionId,
  UserId,
} from "shared";

export interface DashboardGateway {
  getDashboardUrl: (
    adminDashboardKind: AdminDashboardName,
    now: Date,
  ) => AbsoluteUrl;
  getAgencyUserUrl: (agencyIds: AgencyId[], now: Date) => AbsoluteUrl;
  getErroredConventionsDashboardUrl: (
    agencyIds: AgencyId[],
    now: Date,
  ) => AbsoluteUrl;
  getConventionStatusUrl: (id: ConventionId, now: Date) => AbsoluteUrl;
  getEstablishmentConventionsDashboardUrl(
    userId: UserId,
    now: Date,
  ): AbsoluteUrl;
  getEstablishmentDiscussionsDashboardUrl(
    userId: UserId,
    now: Date,
  ): AbsoluteUrl;
}
