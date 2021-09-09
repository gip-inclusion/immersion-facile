import { FeatureFlags } from "../shared/featureFlags";
import { Builder } from "./Builder";

export class FeatureFlagsBuilder implements Builder<FeatureFlags> {
  constructor(
    private featureFlags: FeatureFlags = {
      enableViewableApplications: false,
      enableGenericApplicationForm: false,
      enableBoulogneSurMerApplicationForm: false,
      enableNarbonneApplicationForm: false,
    }
  ) {}

  public enableViewableApplications(): FeatureFlagsBuilder {
    return new FeatureFlagsBuilder({
      ...this.featureFlags,
      enableViewableApplications: true,
    });
  }

  public enableGenericApplicationForm(): FeatureFlagsBuilder {
    return new FeatureFlagsBuilder({
      ...this.featureFlags,
      enableGenericApplicationForm: true,
    });
  }

  public enableBoulogneSurMerApplicationForm(): FeatureFlagsBuilder {
    return new FeatureFlagsBuilder({
      ...this.featureFlags,
      enableBoulogneSurMerApplicationForm: true,
    });
  }

  public enableNarbonneApplicationForm(): FeatureFlagsBuilder {
    return new FeatureFlagsBuilder({
      ...this.featureFlags,
      enableNarbonneApplicationForm: true,
    });
  }

  public build() {
    return this.featureFlags;
  }
}
