import { makeGetBooleanVariable, ProcessEnv } from "./envHelpers";

export class FeatureDisabledError extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, FeatureDisabledError.prototype);
  }
}

export const getFeatureFlags = (processEnv: ProcessEnv) => {
  const getBooleanVariable = makeGetBooleanVariable(processEnv);

  return {
    // Enables getting and updating applications.
    enableViewableApplications: getBooleanVariable(
      "ENABLE_VIEWABLE_APPLICATIONS"
    ),
  };
};

export type FeatureFlags = ReturnType<typeof getFeatureFlags>;
