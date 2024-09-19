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
  "back-office",
  "agency-admin",
  "to-review",
  "agency-viewer",
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
  if (roles.includes("back-office")) return "back-office";
  if (roles.includes("validator")) return "validator";
  if (roles.includes("counsellor")) return "counsellor";
  return roles[0];
};
