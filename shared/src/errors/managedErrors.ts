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

export type ManagedErrorKinds = typeof managedErrorKinds[number];

export const isManagedError = (
  kind: string | undefined,
): kind is ManagedErrorKinds => {
  if (!kind) return false;
  return managedErrorKinds.includes(kind as ManagedErrorKinds);
};
