import { AgencyId } from "../agency/agency.dto";

export type DashboardName = typeof dashboardNames[number];
export const simpleDashboardNames = ["conventions", "events"] as const;
export const dashboardNames = [...simpleDashboardNames, "agency"] as const;

type GenericGetDashboardParams<N extends DashboardName> = {
  name: N;
};

export type GetDashboardParams =
  | GenericGetDashboardParams<"events" | "conventions">
  | (GenericGetDashboardParams<"agency"> & { agencyId: AgencyId });
