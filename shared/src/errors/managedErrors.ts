export const managedRedirectErrorKinds = [
  "peConnectInvalidGrant",
  "peConnectNoAuthorisation",
  "peConnectNoValidAdvisor",
  "peConnectNoValidUser",
  "peConnectAdvisorForbiddenAccess",
  "peConnectUserForbiddenAccess",
] as const;

export type ManagedRedirectErrorKinds =
  typeof managedRedirectErrorKinds[number];
