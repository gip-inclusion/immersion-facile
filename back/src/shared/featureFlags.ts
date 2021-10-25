import { makeGetBooleanVariable, ProcessEnv } from "./envHelpers";

export const getFeatureFlags = (processEnv: ProcessEnv) => {
  const getBooleanVariable = makeGetBooleanVariable(processEnv);

  return {
    enableAdminUi: getBooleanVariable("ENABLE_ADMIN_UI"),
  };
};

export type FeatureFlags = Partial<ReturnType<typeof getFeatureFlags>>;
