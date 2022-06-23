export const managedRedirectErrorKinds = [
  "peConnectInvalidGrant",
  "peConnectNoAuthorisation",
  "peConnectNoValidAdvisor",
  "peConnectNoValidUser",
] as const;

export type ManagedRedirectErrorKinds =
  typeof managedRedirectErrorKinds[number];
