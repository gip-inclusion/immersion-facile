import type {
  AbsoluteUrl,
  AdminDashboardName,
  AgencyDashboards,
  AgencyId,
  AgencyKind,
  ConventionId,
  OmitFromExistingKeys,
  UserId,
} from "shared";

export interface DashboardGateway {
  getAdminDashboardUrl(
    adminDashboardKind: AdminDashboardName,
    now: Date,
  ): AbsoluteUrl;
  getAgencyUserUrls(
    userId: UserId,
    agencyKinds: AgencyKind[],
    now: Date,
  ): OmitFromExistingKeys<AgencyDashboards, "erroredConventionsDashboardUrl">;
  getAgencyForAdminUrl(agencyId: AgencyId, now: Date): AbsoluteUrl;
  getErroredConventionsDashboardUrl(userId: UserId, now: Date): AbsoluteUrl;
  getConventionStatusUrl(id: ConventionId, now: Date): AbsoluteUrl;
  getEstablishmentConventionsDashboardUrl(
    userId: UserId,
    now: Date,
  ): AbsoluteUrl;
  getEstablishmentDiscussionsDashboardUrl(
    userId: UserId,
    now: Date,
  ): AbsoluteUrl;
}
