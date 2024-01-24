import {
  FeatureFlags,
  makeTextFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
  SetFeatureFlagParam,
} from "shared";
import { FeatureFlagRepository } from "../../domain/core/ports/FeatureFlagRepository";

const defaultFlags: FeatureFlags = {
  enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(false, {
    imageAlt: "altImage",
    imageUrl: "https://imageUrl",
    message: "message",
    redirectUrl: "https://redirectUrl",
  }),
  enableMaintenance: makeTextFeatureFlag(false, {
    message: "Maintenance message",
  }),
};

export class InMemoryFeatureFlagRepository implements FeatureFlagRepository {
  #featureFlags: FeatureFlags;

  constructor(featureFlags: Partial<FeatureFlags> = {}) {
    this.#featureFlags = { ...defaultFlags, ...featureFlags };
  }

  public async getAll(): Promise<FeatureFlags> {
    return this.#featureFlags;
  }

  public async insertAll(flags: FeatureFlags): Promise<void> {
    this.#featureFlags = flags;
  }

  public async update(params: SetFeatureFlagParam): Promise<void> {
    this.#featureFlags[params.flagName] = {
      ...this.#featureFlags[params.flagName],
      ...(params.featureFlag as any),
    };
  }
}
