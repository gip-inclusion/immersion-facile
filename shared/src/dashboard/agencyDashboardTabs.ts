export const agencyDashboardTabsList = [
  "onboarding",
  "dashboard",
  "conventions-en-erreur",
] as const;

export type AgencyDashboardTab = (typeof agencyDashboardTabsList)[number];
