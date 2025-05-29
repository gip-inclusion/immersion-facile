export const candidateWarnedMethods = [
  "phone",
  "email",
  "inPerson",
  "other",
] as const;

export type CandidateWarnedMethod = (typeof candidateWarnedMethods)[number];
