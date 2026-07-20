export const beneficiaryDashboardTabsList = [
  "discussions",
  "conventions",
] as const;

export type BeneficiaryDashboardTab =
  (typeof beneficiaryDashboardTabsList)[number];
