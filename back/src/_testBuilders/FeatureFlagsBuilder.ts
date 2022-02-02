import { FeatureFlags } from "../shared/featureFlags";
import { Builder } from "./Builder";

export class FeatureFlagsBuilder implements Builder<FeatureFlags> {
  // Initializes all feature flags to be off.
  private constructor(readonly featureFlags: FeatureFlags = {}) {}

  public static allOff() {
    return new FeatureFlagsBuilder();
  }

  public enableEnterpriseSignatures() {
    return new FeatureFlagsBuilder({
      ...this.featureFlags,
      enableEnterpriseSignature: true,
    });
  }

  public enableByPassInseeApi() {
    return new FeatureFlagsBuilder({
      ...this.featureFlags,
      enableByPassInseeApi: true,
    });
  }

  public build() {
    return this.featureFlags;
  }
}
