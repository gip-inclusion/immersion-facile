export type Role = (typeof allRoles)[number];

export const allRoles = [
  "beneficiary",
  "legal-representative",
  "beneficiary-representative",
  "beneficiary-current-employer",
  "establishment",
  "establishment-representative",
  "establishment-tutor",
  "counsellor",
  "validator",
  "backOffice",
] as const;
