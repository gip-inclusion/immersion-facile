import { Signatories } from "../convention/convention.dto";

export type Role = (typeof allRoles)[number];
export type SignatoryRole = (typeof allSignatoryRoles)[number];
export type AgencyModifierRole = (typeof agencyModifierRoles)[number];
export type ModifierRole = (typeof allModifierRoles)[number];
export type EstablishmentRole = (typeof establishmentsRoles)[number];
export const allRoles = [
  "beneficiary",
  "beneficiary-representative",
  "beneficiary-current-employer",
  "establishment-representative",
  "establishment-tutor",
  "counsellor",
  "validator",
  "backOffice",
  "agencyOwner",
  "toReview",
] as const;

export const allSignatoryRoles = [
  "beneficiary",
  "beneficiary-representative",
  "beneficiary-current-employer",
  "establishment-representative",
] as const satisfies ReadonlyArray<
  Required<Signatories>[keyof Required<Signatories>]["role"]
>;

export const establishmentsRoles = [
  "establishment-representative",
  "establishment-tutor",
] as const;

export const agencyModifierRoles = ["counsellor", "validator"] as const;

export const allModifierRoles = [
  ...allSignatoryRoles,
  ...agencyModifierRoles,
] as const;

export const getRequesterRole = (roles: Role[]): Role => {
  if (roles.includes("backOffice")) return "backOffice";
  if (roles.includes("validator")) return "validator";
  if (roles.includes("counsellor")) return "counsellor";
  return roles[0];
};
