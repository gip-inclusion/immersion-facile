export const agencyDashboardTabsList = [
  "onboarding",
  "dashboard",
  "conventions-synchronisees",
] as const;

export type AgencyDashboardTab = (typeof agencyDashboardTabsList)[number];
