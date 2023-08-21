import { AgencyId } from "../agency/agency.dto";
import { ConventionId } from "../convention/convention.dto";

export type DashboardName =
  | AdminDashboardKind
  | ConventionMagicLinkDashboardName;

export const simpleDashboardKinds = [
  "conventions",
  "events",
  "establishments",
] as const;

export const adminDashboardKinds = [
  ...simpleDashboardKinds,
  "agency",
  "erroredConventions",
] as const;
export type AdminDashboardKind = (typeof adminDashboardKinds)[number];

export type ConventionMagicLinkDashboardName =
  (typeof conventionMagicLinkDashboardNames)[number];
export const conventionMagicLinkDashboardNames = ["conventionStatus"] as const;

type GenericGetDashboardParams<
  N extends AdminDashboardKind | ConventionMagicLinkDashboardName,
> = {
  name: N;
};

export type GetDashboardParams =
  | GetAdminDashboardParams
  | GetConventionMagicLinkDashboardParams;

export type GetAdminDashboardParams =
  | GenericGetDashboardParams<"events" | "conventions" | "establishments">
  | (GenericGetDashboardParams<"agency" | "erroredConventions"> & {
      agencyId: AgencyId;
    });

export type GetConventionMagicLinkDashboardParams =
  | GenericGetDashboardParams<"conventionStatus"> & {
      conventionId: ConventionId;
    };
