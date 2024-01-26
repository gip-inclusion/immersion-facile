import { AbsoluteUrl } from "../AbsoluteUrl";
import { AgencyId } from "../agency/agency.dto";
import { ConventionId } from "../convention/convention.dto";
import { AuthenticatedUserId } from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";

export type DashboardName =
  | AdminDashboardName
  | ConventionMagicLinkDashboardName
  | EstablishmentDashboardName;

export type EstablishmentDashboardName =
  (typeof establishmentDashboardNames)[number];

export const establishmentDashboardNames = [
  "establishmentRepresentativeConventions",
  "establishmentRepresentativeDiscussions",
] as const;

export const simpleDashboardNames = [
  "conventions",
  "events",
  "establishments",
  "agencies",
] as const;

export const adminDashboardNames = [
  ...simpleDashboardNames,
  "agency",
  "erroredConventions",
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
    ic_user_id: AuthenticatedUserId;
  };

export type GetAdminDashboardParams =
  | GenericGetDashboardParams<
      "events" | "conventions" | "establishments" | "agencies"
    >
  | (GenericGetDashboardParams<"agency" | "erroredConventions"> & {
      agencyId: AgencyId;
    });

export type GetConventionMagicLinkDashboardParams =
  | GenericGetDashboardParams<"conventionStatus"> & {
      conventionId: ConventionId;
    };
