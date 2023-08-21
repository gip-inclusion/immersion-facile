import {
  AbsoluteUrl,
  AdminDashboardKind,
  AgencyId,
  ConventionId,
} from "shared";

export interface DashboardGateway {
  getDashboardUrl: (
    adminDashboardKind: AdminDashboardKind,
    now: Date,
  ) => AbsoluteUrl;
  getAgencyUserUrl: (agencyIds: AgencyId[], now: Date) => AbsoluteUrl;
  getErroredConventionsDashboardUrl: (
    agencyIds: AgencyId[],
    now: Date,
  ) => AbsoluteUrl;
  getConventionStatusUrl: (id: ConventionId, now: Date) => AbsoluteUrl;
}
