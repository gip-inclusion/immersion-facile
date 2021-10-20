import { makeGetBooleanVariable, ProcessEnv } from "./envHelpers";

export class FeatureDisabledError extends Error {
  constructor(msg?: string) {
    super(msg);
    Object.setPrototypeOf(this, FeatureDisabledError.prototype);
  }
}

export const getFeatureFlags = (processEnv: ProcessEnv) => {
  const getBooleanVariable = makeGetBooleanVariable(processEnv);

  return {
    enableAdminUi: getBooleanVariable("ENABLE_ADMIN_UI"),
  };
};

export type FeatureFlags = Partial<ReturnType<typeof getFeatureFlags>>;
