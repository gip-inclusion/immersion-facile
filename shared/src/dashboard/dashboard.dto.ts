import { AgencyId } from "../agency/agency.dto";
import { ConventionId } from "../convention/convention.dto";
import { Email } from "../email/email.dto";

export type DashboardName =
  | AdminDashboardKind
  | ConventionMagicLinkDashboardName
  | EstablishmentDashboardKind;

export type EstablishmentDashboardKind =
  (typeof establishmentDashboardKinds)[number];

export const establishmentDashboardKinds = [
  "establishmentRepresentativeConventions",
] as const;

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
  N extends
    | AdminDashboardKind
    | ConventionMagicLinkDashboardName
    | EstablishmentDashboardKind,
> = {
  name: N;
};

export type GetDashboardParams =
  | GetAdminDashboardParams
  | GetConventionMagicLinkDashboardParams
  | GetEstablishmentDashboardParams;

export type GetEstablishmentDashboardParams =
  GenericGetDashboardParams<"establishmentRepresentativeConventions"> & {
    "email_repr%C3%A9sentant_de_l'entreprise": Email;
  };

export type GetAdminDashboardParams =
  | GenericGetDashboardParams<"events" | "conventions" | "establishments">
  | (GenericGetDashboardParams<"agency" | "erroredConventions"> & {
      agencyId: AgencyId;
    });

export type GetConventionMagicLinkDashboardParams =
  | GenericGetDashboardParams<"conventionStatus"> & {
      conventionId: ConventionId;
    };
