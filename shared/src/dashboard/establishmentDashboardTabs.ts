export const establishmentDashboardTabsList = [
  "conventions",
  "discussions",
  "fiche-entreprise",
] as const;

export type EstablishmentDashboardTabList =
  typeof establishmentDashboardTabsList;

export type EstablishmentDashboardTab = EstablishmentDashboardTabList[number];
