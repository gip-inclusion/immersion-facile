import { ConventionId, Role } from "shared";

export type ValidatedConventionNps = {
  conventionId: ConventionId | null;
  role: Role | null;
  score: number | null;
  comments: string | null;
  wouldHaveDoneWithoutIF: boolean | null;
  respondentId: string;
  responseId: string;
  rawResult: unknown;
};
