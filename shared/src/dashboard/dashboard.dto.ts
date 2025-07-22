import type { AbsoluteUrl } from "../AbsoluteUrl";
import type { AgencyId } from "../agency/agency.dto";
import type { ConventionId } from "../convention/convention.dto";
import type { UserId } from "../user/user.dto";

export type DashboardName =
  | AdminDashboardName
  | ConventionMagicLinkDashboardName
  | EstablishmentDashboardName
  | AgencyDashboardName;

export type EstablishmentDashboardName =
  (typeof establishmentDashboardNames)[number];

export const establishmentDashboardNames = [
  "establishmentRepresentativeConventions",
  "establishmentRepresentativeDiscussions",
] as const;

export type AgencyDashboardName = (typeof agencyDashboardNames)[number];
export const agencyDashboardNames = [
  "agencyForUser",
  "erroredConventionsForUser",
  "statsEstablishmentDetails",
  "statsConventionsByEstablishmentByDepartment",
  "statsAgencies",
] as const;

export const simpleDashboardNames = [
  "adminConventions",
  "adminEvents",
  "adminEstablishments",
  "adminAgencies",
] as const;

export const adminDashboardNames = [
  ...simpleDashboardNames,
  "adminAgencyDetails",
] as const;
export type AdminDashboardName = (typeof adminDashboardNames)[number];

export type ConventionMagicLinkDashboardName =
  (typeof conventionMagicLinkDashboardNames)[number];
export const conventionMagicLinkDashboardNames = ["conventionStatus"] as const;

export const allDashboardNames = [
  ...adminDashboardNames,
  ...establishmentDashboardNames,
  ...conventionMagicLinkDashboardNames,
] as const;

type GenericGetDashboardParams<N extends DashboardName> = {
  name: N;
};

export type GetDashboardParams =
  | GetAdminDashboardParams
  | GetConventionMagicLinkDashboardParams
  | GetEstablishmentDashboardParams;

export type DashboardUrlAndName = {
  name: DashboardName;
  url: AbsoluteUrl;
};

export type GetEstablishmentDashboardParams =
  GenericGetDashboardParams<"establishmentRepresentativeConventions"> & {
    ic_user_id: UserId;
  };

export type GetAdminDashboardParams =
  | GenericGetDashboardParams<
      | "adminEvents"
      | "adminConventions"
      | "adminEstablishments"
      | "adminAgencies"
    >
  | (GenericGetDashboardParams<"adminAgencyDetails"> & {
      agencyId: AgencyId;
    });

export type GetConventionMagicLinkDashboardParams =
  GenericGetDashboardParams<"conventionStatus"> & {
    conventionId: ConventionId;
  };
