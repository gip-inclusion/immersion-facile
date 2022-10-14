export type ManagedErrorKind = typeof managedErrorKinds[number];
const managedErrorKinds = [
  "peConnectInvalidGrant",
  "peConnectNoAuthorisation",
  "peConnectNoValidAdvisor",
  "peConnectNoValidUser",
  "peConnectAdvisorForbiddenAccess",
  "peConnectUserForbiddenAccess",
  "httpUnknownClientError",
  "httpClientNotFoundError",
  "httpClientInvalidToken",
  "unknownError",
] as const;

export const isManagedError = (
  kind: string | undefined,
): kind is ManagedErrorKind =>
  kind ? managedErrorKinds.includes(kind as ManagedErrorKind) : false;
