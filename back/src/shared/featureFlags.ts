const getFeatureFlagOrDie = (name: string): boolean => {
  const value = process.env[name];
  if (value === "TRUE") return true;
  if (!value) return false;
  throw new Error(
    `Unexpected value for environment variable ${name}: ${value}. ` +
      `Must be "TRUE" or undefined.`
  );
};

export type FeatureFlags = {
  // Enables getting and updating applications.
  enableViewableApplications: boolean;
};

export const getFeatureFlagsFromEnvVariables = (): FeatureFlags => {
  return {
    enableViewableApplications: getFeatureFlagOrDie(
      "ENABLE_VIEWABLE_APPLICATIONS"
    ),
  };
};

export class FeatureDisabledError extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, FeatureDisabledError.prototype);
  }
}
