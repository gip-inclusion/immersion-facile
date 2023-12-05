import {
  AbsoluteUrl,
  AdminDashboardName,
  AgencyId,
  AuthenticatedUserId,
  ConventionId,
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
    authenticatedUserId: AuthenticatedUserId,
    now: Date,
  ): AbsoluteUrl;
}
