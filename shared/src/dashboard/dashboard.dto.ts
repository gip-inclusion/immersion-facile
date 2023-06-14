import { AgencyId } from "../agency/agency.dto";
import { ConventionId } from "../convention/convention.dto";

export type DashboardName =
  | AdminDashboardName
  | ConventionMagicLinkDashboardName;

export type AdminDashboardName = (typeof dashboardNames)[number];
export const simpleDashboardNames = ["conventions", "events"] as const;
export const dashboardNames = [
  ...simpleDashboardNames,
  "agency",
  "erroredConventions",
] as const;

export type ConventionMagicLinkDashboardName =
  (typeof conventionMagicLinkDashboardNames)[number];
export const conventionMagicLinkDashboardNames = ["conventionStatus"] as const;

type GenericGetDashboardParams<
  N extends AdminDashboardName | ConventionMagicLinkDashboardName,
> = {
  name: N;
};

export type GetDashboardParams =
  | GetAdminDashboardParams
  | GetConventionMagicLinkDashboardParams;

export type GetAdminDashboardParams =
  | GenericGetDashboardParams<"events" | "conventions">
  | (GenericGetDashboardParams<"agency" | "erroredConventions"> & {
      agencyId: AgencyId;
    });

export type GetConventionMagicLinkDashboardParams =
  | GenericGetDashboardParams<"conventionStatus"> & {
      conventionId: ConventionId;
    };

export type ManageConventionAdminForm = {
  conventionId: ConventionId;
};
