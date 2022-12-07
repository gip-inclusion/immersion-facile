import { NotEmptyArray } from "shared";

export const peAdvisorsSupportedTypes = ["PLACEMENT", "CAPEMPLOI"] as const;

export type AdvisorKind = typeof peAdvisorsSupportedTypes[number];

export const conventionPoleEmploiAdvisors: NotEmptyArray<AdvisorKind> = [
  "PLACEMENT",
  "CAPEMPLOI",
];

export type SupportedPeConnectAdvisorDto = {
  email: string;
  firstName: string;
  lastName: string;
  type: AdvisorKind;
};

export type AllPeConnectAdvisorDto = {
  email: string;
  firstName: string;
  lastName: string;
  type: AdvisorKind | "INDEMNISATION";
};
