import { NotEmptyArray } from "shared";

export const peAdvisorImmersionKinds = ["PLACEMENT", "CAPEMPLOI"] as const;
export const peAdvisorKinds = [
  ...peAdvisorImmersionKinds,
  "INDEMNISATION",
] as const;

export const isPeAdvisorImmersionKind = (
  input: string,
): input is PeConnectImmersionAdvisorsKind =>
  immersionPoleEmploiAdvisors.some((value) => value === input);

export const immersionPoleEmploiAdvisors: NotEmptyArray<PeConnectImmersionAdvisorsKind> =
  ["PLACEMENT", "CAPEMPLOI"];

export type PeConnectImmersionAdvisorsKind =
  typeof peAdvisorImmersionKinds[number];

export type PeConnectImmersionAdvisorDto = {
  email: string;
  firstName: string;
  lastName: string;
  type: PeConnectImmersionAdvisorsKind;
};

export type PeConnectAdvisorsKind = typeof peAdvisorKinds[number];

export type PeConnectAdvisorDto = {
  email: string;
  firstName: string;
  lastName: string;
  type: PeConnectAdvisorsKind;
};
