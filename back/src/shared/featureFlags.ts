type EnvVarReaderFn = (name: string) => string | boolean | undefined;

const getFeatureFlagOrDie = (
  envVarReaderFn: EnvVarReaderFn,
  name: string
): boolean => {
  const value = envVarReaderFn(name);
  if (value === "TRUE") return true;
  if (!value) return false;
  throw new Error(
    `Unexpected value for environment variable ${name}: ${value}. ` +
      `Must be "TRUE" or falsy.`
  );
};

export type FeatureFlags = {
  // Enables getting and updating applications.
  enableViewableApplications: boolean;
};

export const getFeatureFlagsFromEnvVariables = (
  envVarReader: EnvVarReaderFn
): FeatureFlags => {
  return {
    enableViewableApplications: getFeatureFlagOrDie(
      envVarReader,
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
