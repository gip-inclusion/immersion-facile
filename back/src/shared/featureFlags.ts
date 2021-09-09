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
    enableGenericApplicationForm: getBooleanVariable(
      "ENABLE_GENERIC_APPLICATION_FORM"
    ),
    enableBoulogneSurMerApplicationForm: getBooleanVariable(
      "ENABLE_BOULOGNE_SUR_MER_APPLICATION_FORM"
    ),
    enableNarbonneApplicationForm: getBooleanVariable(
      "ENABLE_NARBONNE_APPLICATION_FORM"
    ),
  };
};

export type FeatureFlags = ReturnType<typeof getFeatureFlags>;
