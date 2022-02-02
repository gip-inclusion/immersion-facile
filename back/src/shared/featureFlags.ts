import { makeGetBooleanVariable, ProcessEnv } from "./envHelpers";

export const getFeatureFlags = (processEnv: ProcessEnv) => {
  const getBooleanVariable = makeGetBooleanVariable(processEnv);

  return {
    enableAdminUi: getBooleanVariable("ENABLE_ADMIN_UI"),
    // Flag that enables the separate signatures by the company and the beneficiary.
    // This introduces additional application states for collecting signatures of
    // both the company and the beneficiary; as well as state transitions that permit
    // the company and the beneficiary modify the application (revoking other
    // party's signature, if present).
    enableEnterpriseSignature: getBooleanVariable(
      "ENABLE_ENTERPRISE_SIGNATURE",
    ),
    enableByPassInseeApi: getBooleanVariable("ENABLE_BY_PASS_INSEE_API"),
    // enableLBBFetchOnSearch: getBooleanVariable("ENABLE_LBB_FETCH_ON_SEARCH"),
  };
};

export type FeatureFlags = Partial<ReturnType<typeof getFeatureFlags>>;
