import { Signatories } from "..";

export type Role = (typeof allRoles)[number];
export type SignatoryRole = (typeof allSignatoryRoles)[number];
export type ModifierRole = (typeof allModifierRoles)[number];
export const allRoles = [
  "beneficiary",
  "beneficiary-representative",
  "beneficiary-current-employer",
  "establishment-representative",
  "establishment-tutor",
  "counsellor",
  "validator",
  "backOffice",
] as const;

export const allSignatoryRoles = [
  "beneficiary",
  "beneficiary-representative",
  "beneficiary-current-employer",
  "establishment-representative",
] as const satisfies ReadonlyArray<
  Required<Signatories>[keyof Required<Signatories>]["role"]
>;

export const allModifierRoles = [
  "beneficiary",
  "beneficiary-representative",
  "beneficiary-current-employer",
  "establishment-representative",
  "counsellor",
  "validator",
] as const;
