import { NotEmptyArray } from "shared";

export const peAdvisorsSupportedTypes = ["PLACEMENT", "CAPEMPLOI"] as const;
export const isPeAdvisorSupportedTypes = (
  input: string,
): input is AdvisorKind =>
  conventionPoleEmploiAdvisors.some((value) => value === input);

export const conventionPoleEmploiAdvisors: NotEmptyArray<AdvisorKind> = [
  "PLACEMENT",
  "CAPEMPLOI",
];

export type AdvisorKind = typeof peAdvisorsSupportedTypes[number];
export type SupportedPeConnectAdvisorDto = {
  email: string;
  firstName: string;
  lastName: string;
  type: AdvisorKind;
};

type AllPeAdvisorKind = AdvisorKind | "INDEMNISATION";
export type AllPeConnectAdvisorDto = {
  email: string;
  firstName: string;
  lastName: string;
  type: AllPeAdvisorKind;
};
