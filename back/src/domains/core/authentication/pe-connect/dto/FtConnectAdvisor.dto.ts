import { NotEmptyArray } from "shared";

const ftAdvisorImmersionKinds = ["PLACEMENT", "CAPEMPLOI"] as const;
export const ftAdvisorKinds = [
  ...ftAdvisorImmersionKinds,
  "INDEMNISATION",
] as const;

export const isFtAdvisorImmersionKind = (
  input: string,
): input is FtConnectImmersionAdvisorsKind =>
  immersionFranceTravailAdvisors.some((value) => value === input);

export const immersionFranceTravailAdvisors: NotEmptyArray<FtConnectImmersionAdvisorsKind> =
  ["PLACEMENT", "CAPEMPLOI"];

type FtConnectImmersionAdvisorsKind = (typeof ftAdvisorImmersionKinds)[number];

export type FtConnectImmersionAdvisorDto = {
  email: string;
  firstName: string;
  lastName: string;
  type: FtConnectImmersionAdvisorsKind;
};

export type FtConnectAdvisorsKind = (typeof ftAdvisorKinds)[number];

export type FtConnectAdvisorDto = {
  email: string;
  firstName: string;
  lastName: string;
  type: FtConnectAdvisorsKind;
};
