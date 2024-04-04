export const establishmentDashboardTabsList = [
  "conventions",
  "fiche-entreprise",
  "discussions",
] as const;

export type EstablishmentDashboardTab =
  (typeof establishmentDashboardTabsList)[number];
