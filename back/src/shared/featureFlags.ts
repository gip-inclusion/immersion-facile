export type FeatureFlags = {
  enableAdminUi: boolean;
  // Flag that enables the separate signatures by the company and the beneficiary.
  // This introduces additional application states for collecting signatures of
  // both the company and the beneficiary; as well as state transitions that permit
  // the company and the beneficiary modify the application (revoking other
  // party's signature, if present).

  enableByPassInseeApi: boolean;
};
