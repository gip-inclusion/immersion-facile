export const establishmentDashboardTabsList = [
  "conventions",
  "discussions",
  "fiche-entreprise",
] as const;

export type EstablishmentDashboardTab =
  (typeof establishmentDashboardTabsList)[number];
